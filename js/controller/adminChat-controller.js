import { warnUser, deleteAccount, getUserWarnings as getUserWarningsService, expireChat as expireChatService } from "../data/service.js";

export const sendWarning = async (userId) => {
  const result = await warnUser(userId);
  if (result?.ok) {
                alert(`Utilizador ${userId} avisado! Total: ${result.warnings || 0}`);
                return result.warnings || 0;
            } else {
                return alert('Falha ao avisar utilizador.');
  }
};

export const banUser = async (userId) => {
  const result = await deleteAccount(userId);
  if (result?.ok) {
                alert(`Utilizador ${userId} banido!`);
                return result
            } else {
                return alert('Falha ao banir utilizador.');
  }
};

export const getUserWarnings = async (userId) => {
  return getUserWarningsService(userId);
};

export const expireChat = async (chatId) => {
    const result = await expireChatService(chatId);
    if (result?.ok) {
        alert(`Chat ${chatId} expired!`);
    } else {
        alert('Falha ao expirar chat.');
    }
};