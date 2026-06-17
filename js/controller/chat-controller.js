import { getChats, addChats, addChatMessage, reportMessage } from "../data/service.js";
import Chat from "../models/chat-model.js";
import User from "../models/users-model.js";
import socket from "../data/socket.js";

let currentRoomId = null;
let refreshHandler = null;

export async function getChat() { //fetching chats for current user and returning as Chat instances
    const userId = User.fromStorage()?.id;
    const chats = await getChats(userId);
    return chats.map(chat => Chat.fromObject(chat));
}

export const initializeChatSocket = (handler) => { //initialize socket connection and set up event listeners for chat updates
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

export const createChat = async (type) => { //chat creation
    const currentUser = User.fromStorage();
    if (!currentUser?.id) {
        throw new Error("Utilizador não autenticado.");
    }
    // Create a new chat instance and add the current user
    const chat = new Chat(type);
    chat.addUser(currentUser);

    const response = await addChats(chat);
    if (!response.ok) {
        throw new Error("Falha ao criar novo chat.");
    }

    if (response.chat) {
        return Chat.fromObject(response.chat);
    }

    return chat;
};

export const sendMessage = async (chat, text) => { //sending message and emitting socket event to refresh chat for other users
    const currentUser = User.fromStorage();
    const updatedChat = await handleSendMessage(chat, text, currentUser?.id); //regular db update

    if (updatedChat?.id) {
        socket.emit("new_chat_message", {
            chatId: updatedChat.id,
            message: updatedChat.messages?.[updatedChat.messages.length - 1],
            sender: currentUser?.id,
        });
    }

    return updatedChat;
};

export const handleSendMessage = async (chat, text, userId) => { //sending message to server and updating chat instance
    if (!text?.trim()) return chat;

    const chatInstance = chat instanceof Chat ? chat : Chat.fromObject(chat);
    chatInstance.addMessage(text.trim(), userId);

    try {
        await addChatMessage(chatInstance.id, { messages: chatInstance.messages }, userId);
    } catch (error) {
        console.error("Falha ao enviar mensagem:", error);
    }

    return chatInstance;
};

export const handleReportMessage = async (message, chat) => { //reporting message to server and handling errors
    try {
        const result = await reportMessage(message, chat.id);
        return result;
    } catch (error) {
        console.error("Falha ao reportar mensagem:", error);
        return { ok: false };
    }
};


