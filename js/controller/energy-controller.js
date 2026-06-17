document.addEventListener('DOMContentLoaded', () => {
  const energyButtons = document.querySelectorAll('.energy-btn');

  energyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const estadoEscolhido = button.getAttribute('data-estado');
      
      console.log(`Registo guardado no Ruetines: Energia ${estadoEscolhido}`);
      
   
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'translateY(-4px)';
      }, 150);
      
      // A tua lógica de gravação entra aqui
    });
  });
});