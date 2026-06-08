
import { login, updateUserPassword, deleteAccount } from '../data/service.js';
import { getSettings, saveSettings, applySettings, toggleDarkMode, toggleDyslexic } from '../data/settings.js';

export const getUserSettings = getSettings;
export const saveUserSettings = saveSettings;
export const applyUserSettings = applySettings;

export const initializeUserPage = () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
        userEmail.textContent = `Email: ${user.email || 'Desconhecido'}`;
    }
};

export const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem('token');
    window.location.href = '../html/tasks.html';
};

export { toggleDarkMode, toggleDyslexic };

export const handleChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    const user = JSON.parse(localStorage.getItem("user")) || null;
    if (!user) {
        return { ok: false, message: 'Não foi possível encontrar o utilizador. Faça login novamente.' };
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
        return { ok: false, message: 'Preencha todos os campos de password.' };
    }
    if (newPassword !== confirmPassword) {
        return { ok: false, message: 'As passwords não coincidem!' };
    }

    const verify = await login(user.email, currentPassword);
    if (!verify.ok) {
        return { ok: false, message: 'Password atual inválida.' };
    }

    const token = verify.token || sessionStorage.getItem('token');
    if (token) {
        sessionStorage.setItem('token', token);
    }

    const updateResult = await updateUserPassword(user.id, token, newPassword);
    if (!updateResult.ok) {
        return { ok: false, message: updateResult.message || 'Não foi possível atualizar a password. Tente novamente.' };
    }

    return { ok: true, message: 'Password atualizada com sucesso!' };
};

export const handleDeleteAccount = async () => {
    if (confirm('Tem certeza de que deseja eliminar a sua conta? Esta ação é irreversível.')) {
        await deleteAccount(JSON.parse(localStorage.getItem("user")).id, sessionStorage.getItem('token')).then(result => {
            if (!result.ok) {
                alert('Não foi possível eliminar a conta. Tente novamente.');
                return;
            }else{
                alert('Conta eliminada com sucesso!');
                handleLogout();
            }
        })
    }
}