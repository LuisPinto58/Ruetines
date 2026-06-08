// Toda a comunicação com o servidor mock centralizada aqui.
// Os controllers nunca constroem pedidos fetch nem acedem diretamente aos headers ou ao token.

import Chat from "../models/chat-model.js";

const API = 'http://localhost:3000';

const authHeaders = () => ({
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });



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
  if (!res.ok) {
    const errorBody = await res.text();
    return { ok: false, status: res.status, message: errorBody || 'Erro no servidor.' };
  }
  return { ok: true };
};

export const deleteAccount = async (userId, token) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    return { ok: false, status: res.status, message: errorBody || 'Erro no servidor.' };
  }
  return { ok: true };
};

//admin user mngmt

export const warnUser = async (userId) => {
  const userRes = await fetch(`${API}/users/${userId}`, {
    headers: authHeaders(),
  });
  if (!userRes.ok) return { ok: false };

  const user = await userRes.json();
  const warnings = (user.warnings || 0) + 1;

  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ warnings }),
  });
  return { ok: res.ok, warnings };
};

export const banUser = async (userId) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return { ok: res.ok };
};

export const getUserWarnings = async (userId) => {
  const res = await fetch(`${API}/users/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return 0;
  const user = await res.json();
  return user.warnings || 0;
};

//chats
export const getChats = async (userId) => {
  const res = await fetch(`${API}/chats`, { headers: authHeaders() });
  if (!res.ok) return [];

  const chats = await res.json();
  let processed = await Promise.all(chats.map(expireOrDeleteChat));
  processed = processed
    .filter(Boolean)
    .filter(chat => chat.users?.some(userObj => userObj.id === userId))

  if(userId === 3){
    return processed
  }else{
    return processed.filter(chat => chat.type !== "admin" || chat.messages?.length > 1);
  }
};

export const addChats = async (data) => {
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
  return { ok: res.ok };
};

export const addChatMessage = async (chatId, data) => {
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return { ok: res.ok };
};

export const reportMessage = async (message, reporterId, chatId) => {
  const adminUserId = 3;
  const reportChat = new Chat('admin');
  reportChat.addUser({ id: reporterId });
  if (adminUserId !== reporterId) {
    reportChat.addUser({ id: adminUserId });
  }

  const reportedContent = `REPORT: mensagem reportada de ${message.sender} no chat ${chatId} - "${message.content ?? ''}"`;
  reportChat.addMessage(reportedContent, reporterId);

  const res = await fetch(`${API}/chats`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(reportChat.toJSON()),
  });

  return { ok: res.ok };
};

export const expireChat = async (chatId) => {
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status: 'expired' }),
  });
  return { ok: res.ok };
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

