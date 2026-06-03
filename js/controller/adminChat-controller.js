import { warnUser, banUser as banUserService, getUserWarnings as getUserWarningsService, expireChat as expireChatService } from "../data/service.js";

export const sendWarning = async (userId) => {
  return warnUser(userId);
};

export const banUser = async (userId) => {
  return banUserService(userId);
};

export const getUserWarnings = async (userId) => {
  return getUserWarningsService(userId);
};

export const expireChat = async (chatId) => {
    return expireChatService(chatId);
};