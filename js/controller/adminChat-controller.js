import { warnUser, deleteAccount, getUserWarnings as getUserWarningsService, expireChat as expireChatService } from "../data/service.js";

export const sendWarning = async (userId) => { //send warning to user and alert the result, returns warnings
  const result = await warnUser(userId);
  if (result?.ok) {
                alert(`Utilizador ${userId} avisado! Total: ${result.warnings || 0}`);
                return result.warnings || 0; //0 as failsafe
            } else {
                return alert('Falha ao avisar utilizador.');
  }
};

export const banUser = async (userId) => { //delete user account and alert the result
  const result = await deleteAccount(userId);
  if (result?.ok) {
                alert(`Utilizador ${userId} banido!`);
                return result
            } else {
                return alert('Falha ao banir utilizador.');
  }
};

export const getUserWarnings = async (userId) => { //fetch user warnings from server
  return getUserWarningsService(userId);
};

export const expireChat = async (chatId) => { //manual admin chat expiration
    const result = await expireChatService(chatId);
    if (result?.ok) {
        alert(`Chat ${chatId} expired!`);
        window.location.reload(); //reload page to update chat list
    } else {
        alert('Falha ao expirar chat.');
    }
};