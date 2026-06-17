
import { login, updateUserPassword, deleteAccount } from '../data/service.js';
import { getSettings, saveSettings, applySettings, toggleDarkMode, toggleDyslexic } from '../data/settings.js';
import { getTasks } from './tasks-controller.js';
import User from '../models/users-model.js';

export const getUserSettings = getSettings;
export const saveUserSettings = saveSettings;
export const applyUserSettings = applySettings;

export const initializeUserPage = async () => { //getting info for page
    const user = User.fromStorage();
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
        userEmail.textContent = `Email: ${user.email || 'Desconhecido'}`;
    }

    return await renderUserBadges(); //get info from tasks to display badges
};

export const renderUserBadges = async () => {
    const container = document.getElementById('badge-container');
    if (!container) return; //container check

    const tasks = await getTasks(); //gettings tasks from task-controller import

    if (!Array.isArray(tasks) || tasks.length === 0) {
        return '<span class="badge-empty">Ainda não tens tarefas para mostrar.</span>';
    } //task empty state

    return tasks
        .sort((a, b) => Number(b.completed) - Number(a.completed)) //sorting by completed
        .map((task) => { //mapping to html
            const title = task.title?.trim() || 'Sem título';
            const days = task.completedHistory?.length || 0;
            const tier = task.tier || 'bronze';
            const exp = task.experience || 0;
            const progress = exp >= 200
                ? (exp - 200) / 100
                : exp >= 100
                    ? (exp - 100) / 100
                    : exp / 100;
            const progressPct = Math.max(0, Math.min(100, Math.round(progress * 100)));
            const displayPct = tier === 'ouro' ? 100 : progressPct;
            const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
            const statusClass = task.completed ? 'status-completed' : 'status-pending';
            const statusText = task.completed ? 'Concluída hoje' : 'Pendente';
            //returning html for each task for view
            return `
                <div class="task-badge">
                    <div class="task-badge-header">
                        <strong>${title}</strong>
                    </div>
                    <div class="task-badge-progress">
                        <span class="meta-label">Tier: ${tierName}</span>
                        <div class="exp-bar-container">
                            <div class="exp-bar-fill exp-tier-${tier}" style="width: ${displayPct}%;"></div>
                        </div>
                    </div>
                    <small>${days} dia(s) concluído(s)</small>
                </div>
            `;
        })
        .join('');
};

export const handleLogout = () => { //logout function, clearing storage and redirecting to tasks page
    localStorage.removeItem("user");
    sessionStorage.removeItem('token');
    window.location.href = '../html/tasks.html';
};

export { toggleDarkMode, toggleDyslexic };

export const handleChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    const user = User.fromStorage();
    if (!user) {
        return { ok: false, message: 'Não foi possível encontrar o utilizador. Faça login novamente.' };
    }
    if (!currentPassword || !newPassword || !confirmPassword) { //check if fields are filled
        return { ok: false, message: 'Preencha todos os campos de password.' };
    }
    if (newPassword !== confirmPassword) {//password match
        return { ok: false, message: 'As passwords não coincidem!' };
    }

    const verify = await login(user.email, currentPassword);//login call to verify password
    if (!verify.ok) {
        return { ok: false, message: 'Password atual inválida.' };
    }

    const token = verify.token || sessionStorage.getItem('token'); //store token for next requests
    if (token) {
        sessionStorage.setItem('token', token);
    }

    const updateResult = await updateUserPassword(user.id, newPassword); //final update call
    if (!updateResult.ok) {
        return { ok: false, message: updateResult.message || 'Não foi possível atualizar a password. Tente novamente.' };
    }

    return { ok: true, message: 'Password atualizada com sucesso!' };
};

export const handleDeleteAccount = async () => { //accout deletion with confirmation
    if (confirm('Tem certeza de que deseja eliminar a sua conta? Esta ação é irreversível.')) {
        const user = User.fromStorage();
        await deleteAccount(user?.id).then(result => {
            if (!result.ok) {
                alert('Não foi possível eliminar a conta. Tente novamente.');
                return;
            } else {
                alert('Conta eliminada com sucesso!');
                handleLogout();
            }
        })
    }
}