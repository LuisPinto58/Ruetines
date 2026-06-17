
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
    if (!container) return; 

    const tasks = await getTasks(); 

    if (!Array.isArray(tasks) || tasks.length === 0) {
        return '<span class="badge-empty">Ainda não tens tarefas para mostrar.</span>';
    } 

    return tasks
        .sort((a, b) => Number(b.completed) - Number(a.completed)) 
        .map((task) => { 
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
            
            // --- Definição dos teus SVGs Personalizados ---
            const bronzeSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160" class="custom-medal-svg">
              <g id="ruetines-bronze">
                <path d="M 25 10 L 75 10 L 75 80 L 50 95 L 25 80 Z" fill="#5A4E8A"/>
                <path d="M 25 0 L 75 0 L 75 75 L 50 90 L 25 75 Z" fill="#6B5FA0"/>
                <path d="M 43 0 L 57 0 L 57 81 L 50 86 L 43 81 Z" fill="#8A9E83"/>
                <circle cx="50" cy="112" r="35" fill="#303D3D" opacity="0.1"/>
                <circle cx="50" cy="110" r="35" fill="#C07A56"/>
                <circle cx="50" cy="110" r="26" fill="#D28A68"/>
                <path d="M 50 123 C 50 123 38 111 38 103 C 38 97 43 93 48 93 C 50 93 50 96 50 96 C 50 96 50 93 52 93 C 57 93 62 97 62 103 C 62 111 50 123 50 123 Z" fill="#FDFBF7"/>
              </g>
            </svg>`;

            const prataSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160" class="custom-medal-svg">
              <g id="ruetines-silver">
                <path d="M 25 10 L 75 10 L 75 80 L 50 95 L 25 80 Z" fill="#5A4E8A"/>
                <path d="M 25 0 L 75 0 L 75 75 L 50 90 L 25 75 Z" fill="#6B5FA0"/>
                <path d="M 43 0 L 57 0 L 57 81 L 50 86 L 43 81 Z" fill="#8A9E83"/>
                <circle cx="50" cy="112" r="35" fill="#303D3D" opacity="0.1"/>
                <circle cx="50" cy="110" r="35" fill="#A8A89E"/>
                <circle cx="50" cy="110" r="26" fill="#C8C4D4"/>
                <path d="M 50 123 C 50 123 38 111 38 103 C 38 97 43 93 48 93 C 50 93 50 96 50 96 C 50 96 50 93 52 93 C 57 93 62 97 62 103 C 62 111 50 123 50 123 Z" fill="#FDFBF7"/>
              </g>
            </svg>`;

            const ouroSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160" class="custom-medal-svg">
              <g id="ruetines-gold">
                <path d="M 25 10 L 75 10 L 75 80 L 50 95 L 25 80 Z" fill="#5A4E8A"/>
                <path d="M 25 0 L 75 0 L 75 75 L 50 90 L 25 75 Z" fill="#6B5FA0"/>
                <path d="M 43 0 L 57 0 L 57 81 L 50 86 L 43 81 Z" fill="#8A9E83"/>
                <circle cx="50" cy="112" r="35" fill="#303D3D" opacity="0.1"/>
                <circle cx="50" cy="110" r="35" fill="#DCA54A"/>
                <circle cx="50" cy="110" r="26" fill="#F2C56B"/>
                <path d="M 50 123 C 50 123 38 111 38 103 C 38 97 43 93 48 93 C 50 93 50 96 50 96 C 50 96 50 93 52 93 C 57 93 62 97 62 103 C 62 111 50 123 50 123 Z" fill="#FDFBF7"/>
              </g>
            </svg>`;

            // Escolhe a medalha certa consoante o tier da tarefa
            let medalIcon = bronzeSVG; // Por defeito
            if (tier === 'prata') medalIcon = prataSVG;
            if (tier === 'ouro') medalIcon = ouroSVG;
            
            return `
                <div class="medal-card">
                    <div class="medal-icon-wrapper">
                        ${medalIcon}
                    </div>
                    <div class="medal-details">
                        <h4 class="medal-task-title" title="${title}">${title}</h4>
                        <span class="medal-tier-label">${tierName}</span>
                        <div class="exp-bar-container">
                            <div class="exp-bar-fill exp-tier-${tier}" style="width: ${displayPct}%;"></div>
                        </div>
                        <small class="medal-days-text">${days} dia(s) concluído(s)</small>
                    </div>
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