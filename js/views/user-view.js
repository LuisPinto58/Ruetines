import {
    applyUserSettings,
    getUserSettings,
    handleChangePassword,
    handleLogout,
    initializeUserPage,
    toggleDarkMode,
    toggleDyslexic,
    handleDeleteAccount
} from '../controller/user-controller.js';
import { getSettings } from '../data/settings.js';

window.addEventListener('DOMContentLoaded', () => { //setting up page and listeners
    applyUserSettings();
    initializeUserPage();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    //accessibility preferences setup
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const dyslexicToggle = document.getElementById('dyslexic-toggle');
    const currentSettings = getSettings();
    if (darkModeToggle) {
        darkModeToggle.checked = currentSettings.darkMode;
        darkModeToggle.addEventListener('change', () => toggleDarkMode(darkModeToggle.checked));
    }
    if (dyslexicToggle) {
        dyslexicToggle.checked = currentSettings.dyslexic;
        dyslexicToggle.addEventListener('change', () => toggleDyslexic(dyslexicToggle.checked));
    }

    const form = document.getElementById('edit-user-form');
    if (form) {
        form.addEventListener('submit', async (event) => { //change password form sdubmission
            event.preventDefault();
            const currentPassword = document.getElementById('current-password').value.trim();
            const newPassword = document.getElementById('new-password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();

            const result = await handleChangePassword({ currentPassword, newPassword, confirmPassword });
            if (!result.ok) {
                alert(result.message);
                return;
            }

            alert(result.message);
            form.reset();
            if (darkModeToggle) darkModeToggle.checked = getUserSettings().darkMode;
            if (dyslexicToggle) dyslexicToggle.checked = getUserSettings().dyslexic;
        });
    }
});
//password fields are disabled by default to prevent accidents, this listener enables them
document.getElementById("edit-button").addEventListener("click",()=>{
    document.getElementById("current-password").removeAttribute("disabled")
    document.getElementById("new-password").removeAttribute("disabled")
    document.getElementById("confirm-password").removeAttribute("disabled")
    document.getElementById("btn-submit").classList.remove("d-none")
    document.getElementById("edit-button").classList.add("d-none")
})

//account delete listener
document.getElementById("delete-btn").addEventListener("click", async ()=>{
    await handleDeleteAccount();
})

