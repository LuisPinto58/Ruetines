// Toda a comunicação com o servidor mock centralizada aqui.
// Os controllers nunca constroem pedidos fetch nem acedem diretamente aos headers ou ao token.

import Chat from "../models/chat-model.js";
import Task from "../models/tasks-model.js";
import User from "../models/users-model.js";

const API = "http://localhost:3000";

const authHeaders = (token = sessionStorage.getItem("token")) => ({
  Authorization: token ? `Bearer ${token}` : "",
  "Content-Type": "application/json",
});

const jsonHeaders = () => ({ "Content-Type": "application/json" });

const logoutUser = () => {
  //simple logout to clear session
  User.saveToStorage(null);
  sessionStorage.removeItem("token");
  if (typeof window !== "undefined") {
    window.location.href = "../html/tasks.html?loggedOut=true";
  }
};

const getErrorMessage = async (res) => {
  //treating error message
  const text = await res.text();
  if (!text) return "Erro no servidor.";

  try {
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.error || text;
  } catch {
    return text;
  }
};

const handleApiError = async (res) => {
  //centralized error handling to reduce code
  if (res.status === 401 || res.status === 403) {
    logoutUser();
    return {
      ok: false,
      status: res.status,
      message: "Sessão expirada. Faça login novamente.",
    };
  }

  const message = await getErrorMessage(res);
  return {
    ok: false,
    status: res.status,
    message: message || "Erro no servidor.",
  };
};

// user and auth

export const register = async (email, password) => {
  //account register, default is user, admin is added manually in db json
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password, role: "user" }),
  });
  return { ok: res.status === 201 };
};

export const login = async (email, password) => {
  //login, returns token and user data
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false };
  const data = await res.json();
  return { ok: true, token: data.accessToken, user: data.user };
};

export const updateUserPassword = async (userId, password) => {
  //password update
  const res = await fetch(`${API}/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const deleteAccount = async (userId) => {
  //remove user from other chats and deleting account
  const chats = await getChats(userId); //to check chats
  chats.forEach(async (chat) => {
    chat.users = chat.users.filter((user) => user.id !== userId);
    if (chat.users.length === 0) {
      //if no user left, delete, else update without user
      await fetch(`${API}/chats/${chat.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } else {
      await fetch(`${API}/chats/${chat.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ users: chat.users }),
      });
    }
  });

  const tasks = await getAllTasks(); //deleting user tasks
  tasks.filter((task) => task.userid === userId)
    .forEach(async (task) => {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    });

  const res = await fetch(`${API}/users/${userId}`, {
    //delete user
    method: "DELETE",
    headers: authHeaders(),
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
      //in case user gets banned, this function will be used to check before other requests
      logoutUser();
      return {
        ok: false,
        status: res.status,
        message: "Sessão expirada. Faça login novamente.",
      };
    }
    alert("Utilizador não encontrado. A sessão foi encerrada.");
    logoutUser();
    return {
      ok: false,
      status: res.status,
      message: message || "Utilizador não encontrado.",
    };
  }

  return { ok: true, user: await res.json() };
};

//admin user mngmt
export const warnUser = async (userId) => {
  const userRes = await fetch(`${API}/users/${userId}`, {
    //get user to check existance and get warnings
    headers: authHeaders(),
  });
  if (!userRes.ok) return await handleApiError(userRes);

  const user = await userRes.json();
  const warnings = (user.warnings || 0) + 1;

  const res = await fetch(`${API}/users/${userId}`, {
    //update warnings
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ warnings }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true, warnings };
};

export const getUserWarnings = async (userId) => {
  //get user to check existance and get warnings
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
    return {
      ok: false,
      message: userResult.message || "Utilizador não encontrado.",
      chat: null,
    }; //check if user wasnt banned
  }

  const user = userResult.user;

  const res = await fetch(`${API}/chats`, { headers: authHeaders() }); //get users
  if (!res.ok) return [];

  const chats = await res.json();
  let processed = await Promise.all(chats.map(expireOrDeleteChat)); //expire or delete old chats first
  processed = processed
    .filter(Boolean)
    .filter((chat) => chat.users?.some((userObj) => userObj.id === userId)); //get chats with user

  if (user.role == "admin") {
    return processed;
  } else {
    return processed.filter(
      (chat) => chat.type !== "admin" || chat.messages?.length > 1,
    ); //making sure users only see chats when admin responds instead of immediatly seeing he was reported
  }
};

export const addChats = async (data) => {
  const userResult = await getUserById(data.users?.[0]?.id);
  if (!userResult.ok || !userResult.user) {
    return {
      ok: false,
      message: userResult.message || "Utilizador não encontrado.",
      chat: null,
    };
  }

  const user = userResult.user;

  const getChat = await fetch(`${API}/chats`, { headers: authHeaders() }); //getting existing chats to see if there are openings
  if (!getChat.ok) {
    throw new Error("Falha ao obter chats existentes.");
  }

  const chats = await getChat.json();
  const currentUserId = data.users?.[0]?.id;
  const maxUsers = data.type === "individual" ? 2 : 5; //seeing if its going to be a group chat or individual

  if (currentUserId) {
    const openChat = chats
      .filter((chat) => chat.type === data.type && chat.status === "active") //getting chats of same type and active status
      .find(
        (chat) =>
          (chat.users?.length ?? 0) < maxUsers &&
          !chat.users?.some((userObj) => userObj.id === currentUserId), //checking if user isnt in chat and if theres space
      );

    if (openChat) {
      //if theres an open chat user witll be added to it
      const openChatInstance = Chat.fromObject(openChat);
      openChatInstance.addUser(data.users[0]);
      const response = await addChatUser(openChat.id, {
        users: openChatInstance.users,
      });
      return {
        ok: response.ok,
        joined: response.ok,
        chat: { ...openChat, users: openChatInstance.users },
      };
    }
  }
  //if no open chat, create new chat
  const res = await fetch(`${API}/chats`, {
    method: "POST",
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
  //add user to existing chat
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const addChatMessage = async (chatId, data, userId) => {
  //posting messages
  const userResult = await getUserById(userId); //usual user check
  if (!userResult.ok || !userResult.user) {
    return {
      ok: false,
      message: userResult.message || "Utilizador não encontrado.",
      chat: null,
    };
  }

  const res = await fetch(`${API}/chats/${chatId}`, {
    //patching chat
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};
//user message report
export const reportMessage = async (message, chatId) => {
  const adminRes = await fetch(`${API}/users?role=admin`, {
    headers: authHeaders(),
  });
  if (!adminRes.ok) {
    throw new Error("Falha ao obter administradores.");
  } //in case theres an error on fetch

  const [adminUser] = await adminRes.json();
  if (!adminUser?.id) {
    throw new Error("Nenhum administrador encontrado.");
  } //just making sure admin actually exists

  const reportChat = new Chat("admin"); //create chat and admin eported user and admin
  reportChat.addUser({ id: message.sender });
  if (adminUser.id !== message.sender) {
    reportChat.addUser({ id: adminUser.id });
  }

  const reportedContent = `REPORT: mensagem reportada de ${message.sender} no chat ${chatId} - "${message.content ?? ""}"`; //adding reported message to chat
  reportChat.addMessage(reportedContent, message.sender);

  const res = await fetch(`${API}/chats`, {
    //final post
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(reportChat.toJSON()),
  });

  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

export const expireChat = async (chatId) => {
  //patch status to manually expire chat (admin)
  const res = await fetch(`${API}/chats/${chatId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status: "expired" }),
  });
  if (!res.ok) return await handleApiError(res);
  return { ok: true };
};

const DAY_MS = 24 * 60 * 60 * 1000; //here to change if needed, currently set to 1 day for expiration and 3 days for deletion

const expireOrDeleteChat = async (chat) => {
  if (!chat?.timeStamp || !chat?.id) return chat;
  if (chat.type === "admin") return chat; //admin chats arent auto expired or deleted, only manually
  const ageMs = Date.now() - new Date(chat.timeStamp).getTime();

  if (ageMs >= 3 * DAY_MS) {
    //delete if chat is older than 3 days
    await fetch(`${API}/chats/${chat.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return null;
  }

  if (ageMs >= DAY_MS && chat.status !== "expired") {
    //expire if chat is older than a day and currently active
    const res = await fetch(`${API}/chats/${chat.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "expired" }),
    });
    if (res.ok) {
      return { ...chat, status: "expired" };
    }
  }

  return chat;
};

// ──────────────────────────────────────────────────────────────
// tasks & premadeTasks
// ──────────────────────────────────────────────────────────────

/**
 * Busca todas as tarefas "premade" (modelos).
 * @returns {Promise<Task[]>}
 */
export const getPremadeTasks = async () => {
  const res = await fetch(`${API}/premadeTasks`);
  if (!res.ok) return [];
  const tasks = await res.json();
  return Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
};

/**
 * Cria uma nova tarefa modelo (premade).
 * @param {Task|Object} task
 * @returns {Promise<Task|undefined>}
 */
export const createPremadeTask = async (task) => {
  const taskObj = task instanceof Task ? task : Task.fromObject(task);
  if (!taskObj.id) taskObj.id = crypto.randomUUID();
  taskObj.userid = null;
  taskObj.premadeId = null;

  const res = await fetch(`${API}/premadeTasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(taskObj.toJSON()),
  });
  if (!res.ok) {
    console.error("Error creating premade task:", res.statusText);
    return;
  }
  const data = await res.json();
  return Task.fromObject(data);
};

/**
 * Atualiza uma tarefa modelo e propaga as alterações para todas as
 * tarefas de utilizador que referenciam esse modelo (premadeId).
 * @param {Task|Object} task
 * @returns {Promise<Task|undefined>}
 */
export const updatePremadeTask = async (task) => {
  const taskObj = task instanceof Task ? task : Task.fromObject(task);

  const res = await fetch(`${API}/premadeTasks/${taskObj.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(taskObj.toJSON()),
  });
  if (!res.ok) {
    console.error("Error updating premade task:", res.statusText);
    return;
  }
  const updatedTemplate = await res.json();

  // Propagation: get all tasks and update matching user tasks
  const tasksRes = await fetch(`${API}/tasks`);
  const allTasks = await tasksRes.json();

  for (const t of allTasks) {
    if (t.premadeId === taskObj.id) {
      const updatedUserTask = {
        ...t,
        title: taskObj.title,
        description: taskObj.description,
        schedules: taskObj.schedules,
      };

      for (const key of Object.keys(taskObj)) {
        if (
          ![
            "id",
            "premadeId",
            "userid",
            "userId",
            "timeStamp",
            "status",
            "completedHistory",
            "isAdmin",
          ].includes(key)
        ) {
          updatedUserTask[key] = taskObj[key];
        }
      }

      await fetch(`${API}/tasks/${t.id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(updatedUserTask),
      });
    }
  }

  return Task.fromObject(updatedTemplate);
};

/**
 * Apaga uma tarefa modelo e anula o premadeId das tarefas de
 * utilizador que a referenciam
 * @param {string|Object} task - id da tarefa ou objeto com id
 * @returns {Promise<{success: boolean}>}
 */
export const deletePremadeTask = async (task) => {
  const id = task?.id ?? task;
  const res = await fetch(`${API}/premadeTasks/${id}`, {
    headers: authHeaders(),
    method: "DELETE",
  });
  if (!res.ok) {
    console.error("Error deleting premade task:", res.statusText);
    return { success: false };
  }

  // Nullify premadeId of user tasks that referenced this template
  const tasksRes = await fetch(`${API}/tasks`);
  const allTasks = await tasksRes.json();
  for (const t of allTasks) {
    if (t.premadeId === id) {
      await fetch(`${API}/tasks/${t.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...t, premadeId: null }),
      });
    }
  }

  return { success: true };
};

/**
 * Obtém todas as tarefas dos utilizadores.
 * @returns {Promise<Task[]>}
 */
export const getAllTasks = async () => {
  const res = await fetch(`${API}/tasks`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const tasks = await res.json();
  return Array.isArray(tasks) ? tasks.map(Task.fromObject) : [];
};

/**
 * Cria uma nova tarefa para um utilizador.
 * @param {Task|Object} task
 * @returns {Promise<Task|undefined>}
 */
export const createTask = async (task) => {
  const taskObj = task instanceof Task ? task : Task.fromObject(task);

  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(taskObj.toJSON()),
  });
  if (!res.ok) {
    console.error("Error creating task:", res.statusText);
    return;
  }
  const data = await res.json();
  return Task.fromObject(data);
};

/**
 * Atualiza uma tarefa de utilizador.
 * @param {Task|Object} task
 * @returns {Promise<Task|undefined>}
 */
export const updateTask = async (task) => {
  const taskObj = task instanceof Task ? task : Task.fromObject(task);

  const res = await fetch(`${API}/tasks/${taskObj.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(taskObj.toJSON()),
  });
  if (!res.ok) {
    console.error("Error updating task:", res.statusText);
    return;
  }
  const data = await res.json();
  return Task.fromObject(data);
};

/**
 * Apaga uma tarefa de utilizador.
 * @param {string|Object} task - id da tarefa ou objeto com id
 * @returns {Promise<Object>}
 */
export const deleteTask = async (task) => {
  const id = task?.id ?? task;
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    console.error("Error deleting task:", res.statusText);
    return {};
  }
  const data = await res.json().catch(() => ({}));
  return data;
};
