// Dark mode toggle
const darkToggle = document.getElementById('dark-mode-toggle');
const darkStatus = document.getElementById('dark-status');

darkToggle.addEventListener('change', () => {
    darkStatus.textContent = darkToggle.checked ? 'Ativado' : 'Desativado';
});
