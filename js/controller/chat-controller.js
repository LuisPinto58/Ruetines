import { getChats, addChats, addChatMessage } from "../data/service.js";
import Chat from "../models/chat-model.js";

export async function getChat() {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const chats = await getChats(userId);
    return chats.map(chat => Chat.fromObject(chat));
}

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

    return chat;
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
