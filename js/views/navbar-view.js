// Create desktop navbar with 3 text items
import { login, register } from '../data/service.js';
import { applySettings } from '../data/settings.js';

function createDesktopNavbar(navItems) {
  const navbar = document.createElement('nav');
  navbar.className = 'navbar navbar-desktop';

  const logoContainer = document.createElement('div');
  logoContainer.className = 'navbar-logo';
  logoContainer.innerHTML = '<img src="../assets/img/logo.svg" width="100" alt="Landing Page button with Ruetines Logo">';

  const navList = document.createElement('ul');
  navList.className = 'navbar-items';

  navItems.forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.href || '#';
    link.textContent = item.label;
    if (item.href === 'nan') {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        alert('Funcionalidade não disponível para utilizadores não autenticados!');
      });
      link.classList.add('disabled');
    } if (item.href === window.location.pathname.replace("/Ruetines", "..")) {
      link.classList.add('active');
    }
    li.appendChild(link);
    navList.appendChild(li);
  });
  if (localStorage.getItem('user')) {
    navbar.appendChild(logoContainer);
    navbar.appendChild(navList);
    navbar.style.justifyContent = 'flex-start';
  } else {
    const authContainer = document.createElement('div');
    authContainer.className = 'navbar-auth';

    const loginClick = document.createElement('a');
    loginClick.className = 'navbar-login';
    loginClick.href = '#';
    loginClick.textContent = 'Log in';
    loginClick.addEventListener('click', function (event) {
      event.preventDefault();
      if (!document.querySelector('.login-modal')) {
        document.body.appendChild(createLoginModal());
      }
    });
    authContainer.appendChild(loginClick);

    navbar.appendChild(logoContainer);
    navbar.appendChild(navList);
    navbar.appendChild(authContainer);
  }

  return navbar;
}

// Create mobile navbar with logo on top and bottom icon navbar
function createMobileNavbar(navItems) {
  const mobileContainer = document.createElement('div');
  mobileContainer.className = 'mobile-navbar-container';

  // Top section with logo
  const topBar = document.createElement('nav');

  const logoContainer = document.createElement('div');
  logoContainer.className = 'navbar-logo';
  logoContainer.innerHTML = '<img src="../assets/img/logo.svg" width="100" alt="Landing Page button with Ruetines Logo">';

  if (localStorage.getItem('user')) {
    topBar.className = 'navbar navbar-mobile-top navbar-logged';
    topBar.appendChild(logoContainer);
  } else {
    topBar.className = 'navbar navbar-mobile-top';
    const authContainer = document.createElement('div');
    authContainer.className = 'navbar-auth';

    const loginClick = document.createElement('a');
    loginClick.className = 'navbar-login';
    loginClick.href = '#';
    loginClick.textContent = 'Log in';
    loginClick.addEventListener('click', function (event) {
      event.preventDefault();
        document.body.appendChild(createLoginModal());
    });

    topBar.appendChild(logoContainer);
    authContainer.appendChild(loginClick);
    topBar.appendChild(authContainer);
  }

  mobileContainer.appendChild(topBar);

  // Bottom navigation bar with icons
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'navbar navbar-mobile-bottom';

  const iconList = document.createElement('ul');
  iconList.className = 'navbar-icons';

  navItems.forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.href || '#';
    if (item.href === 'nan') {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        alert('Funcionalidade não disponível para utilizadores não autenticados!');
      });
    }
    link.title = item.label;

    const icon = document.createElement('span');
    icon.className = `icon icon-${item.icon}`;
    icon.textContent = item.icon;

    link.appendChild(icon);
    li.appendChild(link);
    iconList.appendChild(li);
  });

  bottomNav.appendChild(iconList);
  mobileContainer.appendChild(bottomNav);

  return mobileContainer;
}


function  createLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade show login-modal';
  modal.style.display = 'block';
  modal.tabIndex = -1;

  const modalHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"></h5>
          <button type="button" class="btn-close" aria-label="Close"></button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>
  `;

  modal.innerHTML = modalHTML;

  changeModalContent(modal, 'login');


  const closeModal = () => {
    modal.remove();
    document.body.classList.remove('modal-open');
  };

  const closeButton = modal.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.body.classList.add('modal-open');
  return modal;
}

function getNavItems() {

  if (!localStorage.getItem('user')) {
    return [
    { label: 'Perfil', href: 'nan', icon: '👤' },
    { label: 'Painel principal', href: '../html/tasks.html', icon: '🏠' },
    { label: 'Chat', href: 'nan', icon: '📧' }
  ];}

  if (JSON.parse(localStorage.getItem('user')).role === 'admin') {
    return [
      { label: 'Perfil', href: '../html/user.html', icon: '👤' },
      { label: 'Painel principal', href: '../html/adminTasks.html', icon: '🏠' },
      { label: 'Chat', href: '../html/chat.html', icon: '📧' }
    ];
  }

  if ((JSON.parse(localStorage.getItem('user'))).role === 'user') {
    return [
      { label: 'Perfil', href: '../html/user.html', icon: '👤' },
      { label: 'Painel principal', href: '../html/loggedTasks.html', icon: '🏠' },
      { label: 'Chat', href: '../html/chat.html', icon: '📧' }
    ];
  }
}

function changeModalContent(modal, type) {
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  if (type === 'signup') {
    modalTitle.textContent = 'Registar';
    modalBody.innerHTML = `
      <form class="signup-form">
        <div class="mb-3">
          <label for="signup-email" class="form-label">Email</label>
          <input type="email" class="form-control" id="signup-email" placeholder="email@exemplo.com" required>
        </div>
        <div class="mb-3">
          <label for="signup-password" class="form-label">Password</label>
          <input type="password" class="form-control" id="signup-password" placeholder="Introduza a sua password" required>
        </div>
        <div class="mb-3">
          <label for="signup-password-confirm" class="form-label">Confirme a Password</label>
          <input type="password" class="form-control" id="signup-password-confirm" placeholder="Confirme a sua password" required>
        </div>
        <button type="submit" class="btn btn-primary login-button w-100">Registar</button>
      </form>
    `;

    const signupForm = modal.querySelector('.signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = this.querySelector('#signup-email').value;
        const password = this.querySelector('#signup-password').value;
        const passwordConfirm = this.querySelector('#signup-password-confirm').value;
      if (password !== passwordConfirm) {
        alert('As passwords não coincidem!');
        return;
      }

      const result = await register(email, password);
      if (!result.ok) {
        alert('Registo falhou. Tente novamente com outro email.');
        return;
      }

      alert('Registo realizado! Faça login para continuar');
      changeModalContent(modal, 'login');
    });
    }
  } else if (type === 'login') {
    modalTitle.textContent = 'Log in';
    modalBody.innerHTML = `
      <form class="login-form">
        <div class="mb-3">
          <label for="login-email" class="form-label">Email</label>
          <input type="email" class="form-control" id="login-email" placeholder="email@exemplo.com" required>
        </div>
        <div class="mb-3">
          <label for="login-password" class="form-label">Password</label>
          <input type="password" class="form-control" id="login-password" placeholder="Introduza a sua password" required>
        </div>
        <div class="d-flex justify-content-between gap-2 flex-wrap">
          <button type="submit" class="btn btn-primary w-100 login-button">Log in</button>
          <button type="button" class="btn btn-outline-secondary w-100 signup-button" id="signup-button">Registar</button>
        </div>
      </form>
    `;
    const form = modal.querySelector('.login-form');
    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;

        const result = await login(email, password);
        if (!result.ok) {
          alert('Credenciais inválidas.');
          return;
        }

        sessionStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        location.href = "loggedTasks.html";

        closeModal();
        renderNavbar('both', getNavItems());
      });
    }

    const signUpButton = modal.querySelector('.signup-button');
    if (signUpButton) {
      signUpButton.addEventListener('click', function () {
        changeModalContent(modal, 'signup');
      });
    }
  }
}

// Render navbar based on type
function renderNavbar(type, navItems) {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  container.innerHTML = '';

  if (type === 'desktop') {
    container.appendChild(createDesktopNavbar(navItems));
  } else if (type === 'mobile') {
    container.appendChild(createMobileNavbar(navItems));
  } else if (type === 'both') {
    // Render both for media query switching
    const desktopWrapper = document.createElement('div');
    desktopWrapper.className = 'navbar-wrapper navbar-desktop-wrapper';
    desktopWrapper.appendChild(createDesktopNavbar(navItems));

    const mobileWrapper = document.createElement('div');
    mobileWrapper.className = 'navbar-wrapper navbar-mobile-wrapper';
    mobileWrapper.appendChild(createMobileNavbar(navItems));

    container.appendChild(desktopWrapper);
    container.appendChild(mobileWrapper);
  }
}

// init navbar
document.addEventListener('DOMContentLoaded', function () {
  applySettings();
  const navbarContainer = document.createElement('div');
  navbarContainer.id = 'navbar-container';
  document.body.insertBefore(navbarContainer, document.body.firstChild);
  renderNavbar('both', getNavItems());
  let fonts = [document.createElement("link"),document.createElement("link"),document.createElement("link"),document.createElement("link")]
  fonts[0].href= "https://fonts.googleapis.com"
  fonts[0].rel= "preconnect"
  fonts[1].href= "https://fonts.gstatic.com"
  fonts[1].rel= "preconnect"
  fonts[1].crossOrigin= ""
  fonts[2].href= "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
  fonts[2].rel= "stylesheet"
  fonts[3].href= "https://fonts.cdnfonts.com/css/open-dyslexic"
  fonts[3].rel= "stylesheet"
  document.head.appendChild(fonts[0])
  document.head.appendChild(fonts[1])
  document.head.appendChild(fonts[2])
  document.head.appendChild(fonts[3])
  const url = new URLSearchParams(location.search);
  if (url.has('loggedOut')) {
    if (!document.querySelector('.login-modal')) {
        document.body.appendChild(createLoginModal());
      }
  }
});
