function init(){
    if(!sessionStorage.getItem('token') && localStorage.getItem("user")){
        localStorage.removeItem("user");
        window.location.href = 'html/tasks.html?loggedOut=true';
    }
}

init();

// Scroll to Sections

const menuLinks = document.querySelectorAll('.menu-links a[href^="#"]');

menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
            });
});



// SCROLLING ANIMATION

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible')
        }
    });
}, { threshold: 0.1 });

const animacaoElements = document.querySelectorAll('.fade-in');
animacaoElements.forEach(elemento => {
    observer.observe(elemento);
});