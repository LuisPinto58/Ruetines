//for local storage dark mode and dyslexic settings
const defaultSettings = {
    darkMode: false,
    dyslexic: false,
};

export const getSettings = () => {
    return JSON.parse(localStorage.getItem('userSettings')) || defaultSettings;
};

export const saveSettings = (settings) => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
};

export const applySettings = () => {
    const settings = getSettings();
    document.body.classList.toggle('dark-mode', settings.darkMode);
    document.body.classList.toggle('open-dyslexic', settings.dyslexic);
};

export const toggleDarkMode = (enabled) => {
    const settings = getSettings();
    settings.darkMode = enabled;
    saveSettings(settings);
    applySettings();
};

export const toggleDyslexic = (enabled) => {
    const settings = getSettings();
    settings.dyslexic = enabled;
    saveSettings(settings);
    applySettings();
};