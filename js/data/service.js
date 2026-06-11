// Toda a comunicação com o servidor mock centralizada aqui.
// Os controllers nunca constroem pedidos fetch nem acedem diretamente aos headers ou ao token.

import Chat from "../models/chat-model.js";
import User from "../models/users-model.js";

const API = 'http://localhost:3000';

const authHeaders = (token = sessionStorage.getItem('token')) => ({
  'Authorization': token ? `Bearer ${token}` : '',
  'Content-Type': 'application/json',
});

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

const logoutUser = () => {
  User.saveToStorage(null);
  sessionStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    window.location.href = '../html/tasks.html?loggedOut=true';
  }
};

const getErrorMessage = async (res) => {
  const text = await res.text();
  if (!text) return 'Erro no servidor.';

  try {
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.error || text;
  } catch {
    return text;
  }
};

const handleApiError = async (res) => {
  if (res.status === 401 || res.status === 403) {
    logoutUser();
    return { ok: false, status: res.status, message: 'Sessão expirada. Faça login novamente.' };
  }

  const message = await getErrorMessage(res);
  return { ok: false, status: res.status, message: message || 'Erro no servidor.' };
};



// user and auth

export const register = async (email, password) => {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password, role: 'user' }),
  });
  return { ok: res.status === 201 };
};

export const login = async (email, password) => {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false };
  const data = await res.json();
  return { ok: true, token: data.accessToken, user: data.user };
};

export const updateUserPassword = async (userId, token, password) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const deleteAccount = async (userId, token) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const getUserById = async (userId) => {
  const res = await fetch(`${API}/users/${userId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const message = await getErrorMessage(res);

    if (res.status === 401 || res.status === 403) {
      logoutUser();
      return { ok: false, status: res.status, message: 'Sessão expirada. Faça login novamente.' };
    }
      alert('Utilizador não encontrado. A sessão foi encerrada.');
      logoutUser();
      return { ok: false, status: res.status, message: message || 'Utilizador não encontrado.' };
    }

  return { ok: true, user: await res.json() };
};

//admin user mngmt
export const warnUser = async (userId) => {
  const userRes = await fetch(`${API}/users/${userId}`, {
    headers: authHeaders(),
  });
  if (!userRes.ok) return await handleApiError(userRes);

  const user = await userRes.json();
  const warnings = (user.warnings || 0) + 1;

  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ warnings }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true, warnings };
};

export const banUser = async (userId) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const getUserWarnings = async (userId) => {
  const res = await fetch(`${API}/users/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleApiError(res);
    return 0;
  }
  const user = await res.json();
  return user.warnings || 0;
};

//chats
export const getChats = async (userId) => {
  const userResult = await getUserById(userId);

  if (!userResult.ok || !userResult.user) {
    return { ok: false, message: userResult.message || 'Utilizador não encontrado.', chat: null };
  }

  const user = userResult.user;

  const res = await fetch(`${API}/chats`, { headers: authHeaders() });
  if (!res.ok) return [];

  const chats = await res.json();
  let processed = await Promise.all(chats.map(expireOrDeleteChat));
  processed = processed
    .filter(Boolean)
    .filter(chat => chat.users?.some(userObj => userObj.id === userId))

  if (user.role == 'admin') {
    return processed
  }else{
    return processed.filter(chat => chat.type !== "admin" || chat.messages?.length > 1);
  }
};

export const addChats = async (data) => {
  const userResult = await getUserById(data.users?.[0]?.id);
  if (!userResult.ok || !userResult.user) {
    return { ok: false, message: userResult.message || 'Utilizador não encontrado.', chat: null };
  }

  const user = userResult.user;

  const getChat = await fetch(`${API}/chats`, { headers: authHeaders() });
  if (!getChat.ok) {
    throw new Error("Falha ao obter chats existentes.");
  }

  const chats = await getChat.json();
  const currentUserId = data.users?.[0]?.id;
  const maxUsers = data.type === "individual" ? 2 : 5;

  if (currentUserId) {
    const openChat = chats
      .filter(chat => chat.type === data.type && chat.status === "active")
      .find(chat =>
        (chat.users?.length ?? 0) < maxUsers &&
        !chat.users?.some(userObj => userObj.id === currentUserId)
      );

    if (openChat) {
      const openChatInstance = Chat.fromObject(openChat);
      openChatInstance.addUser(data.users[0]);
      const response = await addChatUser(openChat.id, { users: openChatInstance.users });
      return { ok: response.ok, joined: response.ok, chat: { ...openChat, users: openChatInstance.users } };
    }
  }

  const res = await fetch(`${API}/chats`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return { ok: false, joined: false, chat: null };
  }

  const createdChat = await res.json();
  return { ok: res.ok, joined: false, chat: createdChat };
};


export const addChatUser = async (chatId, data) => {
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const addChatMessage = async (chatId, data, userId) => {
  const userResult = await getUserById(userId);
  if (!userResult.ok || !userResult.user) {
    return { ok: false, message: userResult.message || 'Utilizador não encontrado.', chat: null };
  }

  const res = await fetch(`${API}/chats/${chatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const reportMessage = async (message, chatId) => {
  const adminRes = await fetch(`${API}/users?role=admin`, { headers: authHeaders() });
  if (!adminRes.ok) {
    throw new Error("Falha ao obter administradores.");
  }

  const [adminUser] = await adminRes.json();
  if (!adminUser?.id) {
    throw new Error("Nenhum administrador encontrado.");
  }

  const reportChat = new Chat('admin');
  reportChat.addUser({ id: message.sender });
  if (adminUser.id !== message.sender) {
    reportChat.addUser({ id: adminUser.id });
  }

  const reportedContent = `REPORT: mensagem reportada de ${message.sender} no chat ${chatId} - "${message.content ?? ''}"`;
  reportChat.addMessage(reportedContent, message.sender);

  const res = await fetch(`${API}/chats`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(reportChat.toJSON()),
  });

  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const expireChat = async (chatId) => {
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status: 'expired' }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const expireOrDeleteChat = async (chat) => {
  if (!chat?.timeStamp || !chat?.id) return chat;
  if(chat.type === "admin") return chat;
  const ageMs = Date.now() - new Date(chat.timeStamp).getTime();

  if (ageMs >= 3 * DAY_MS) {
    await fetch(`${API}/chats/${chat.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return null;
  }

  if (ageMs >= DAY_MS && chat.status !== 'expired') {
    const res = await fetch(`${API}/chats/${chat.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'expired' }),
    });
    if (res.ok) {
      return { ...chat, status: 'expired' };
    }
  }

  return chat;
};

