import { getChats, addChats, addChatMessage, reportMessage } from "../data/service.js";
import Chat from "../models/chat-model.js";
import socket from "../data/socket.js";

let currentRoomId = null;
let refreshHandler = null;

export async function getChat() {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const chats = await getChats(userId);
    return chats.map(chat => Chat.fromObject(chat));
}

export const initializeChatSocket = (handler) => {
    refreshHandler = handler;

    socket.on("refresh_chat", async (payload) => {
        if (!payload || payload.chatId !== currentRoomId) return;
        console.log("Socket event: refresh_chat", payload);
        if (typeof refreshHandler === "function") {
            await refreshHandler(payload);
        }
    });
};

export const joinChatRoom = (chatId) => {
    if (!chatId || !socket?.connected) return;
    if (currentRoomId) {
        socket.emit("leave_chat", currentRoomId);
    }

    currentRoomId = chatId;
    socket.emit("join_chat", chatId);
};

export const createChat = async (type) => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser?.id) {
        throw new Error("Utilizador não autenticado.");
    }

    const chat = new Chat(type);
    chat.addUser(currentUser);

    const response = await addChats(chat);
    console.log(response);
    if (!response.ok) {
        throw new Error("Falha ao criar novo chat.");
    }

    if (response.chat) {
        return Chat.fromObject(response.chat);
    }

    return chat;
};

export const sendMessage = async (chat, text) => {
    const updatedChat = await handleSendMessage(chat, text);

    if (updatedChat?.id) {
        socket.emit("new_chat_message", {
            chatId: updatedChat.id,
            message: updatedChat.messages?.[updatedChat.messages.length - 1],
            sender: JSON.parse(localStorage.getItem("user"))?.id,
        });
    }

    return updatedChat;
};

export const handleSendMessage = async (chat, text) => {
    if (!text?.trim()) return chat;

    const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
    if (!currentUserId) {
        throw new Error("Utilizador não autenticado.");
    }

    const chatInstance = chat instanceof Chat ? chat : Chat.fromObject(chat);
    chatInstance.addMessage(text.trim(), currentUserId);

    try {
        await addChatMessage(chatInstance.id, { messages: chatInstance.messages });
    } catch (error) {
        console.error("Falha ao enviar mensagem:", error);
    }

    return chatInstance;
};

export const handleReportMessage = async (message, chat) => {
    const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
    if (!currentUserId) {
        throw new Error("Utilizador não autenticado.");
    }

    try {
        const result = await reportMessage(message, currentUserId, chat.id);
        return result;
    } catch (error) {
        console.error("Falha ao reportar mensagem:", error);
        return { ok: false };
    }
};
