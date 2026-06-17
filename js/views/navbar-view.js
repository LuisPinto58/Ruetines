// Create desktop navbar with 3 text items
import { login, register } from '../data/service.js';
import { applySettings } from '../data/settings.js';
import User from '../models/users-model.js';

function createDesktopNavbar(navItems) { //desktop navbar with items on top
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

    if (item.href === 'nan') { //nan to identify unauthenticated user
      link.addEventListener('click', function (event) {
        event.preventDefault();
        alert('Funcionalidade não disponível para utilizadores não autenticados!');
      });
      link.classList.add('disabled');
    } else {
      const fileName = item.href.split('/').pop();
      if (fileName && window.location.pathname.includes(fileName)) { //highlight page
        link.classList.add('active');
      }
    }

    li.appendChild(link);
    navList.appendChild(li);
  });

  if (User.fromStorage()) { //checking if user is logged in to hide login button
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
        document.body.appendChild(createLoginModal()); //login modal is added dynamically
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

  if (User.fromStorage()) { //hiding login button for logged user
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
      document.body.appendChild(createLoginModal()); //dynamic modal
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
    if (item.href === 'nan') { //nan to identify unauthenticated user
      link.addEventListener('click', function (event) {
        event.preventDefault();
        alert('Funcionalidade não disponível para utilizadores não autenticados!');
      });
      link.classList.add('disabled');
    } else {
      const fileName = item.href.split('/').pop();
      if (fileName && window.location.pathname.includes(fileName)) {
        link.classList.add('active');
      }
    }
    link.title = item.label;

    const icon = document.createElement('span');
    icon.className = `icon icon-${item.icon}`;
    icon.innerHTML = item.icon;

    link.appendChild(icon);
    li.appendChild(link);
    iconList.appendChild(li);
  });

  bottomNav.appendChild(iconList);
  mobileContainer.appendChild(bottomNav);

  return mobileContainer;
}


function createLoginModal() { //creating login modal dynamically
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

  changeModalContent(modal, 'login'); //initializing with login forms

  //funcionality to close modal since its dynamically created
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

function getNavItems() { //setting up nav items
  const userIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-person"
                viewBox="0 0 16 16">
                <path
                    d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
            </svg>`
  const taskIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-list-task" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"/>
              <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>
              <path fill-rule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"/>
            </svg>`
  const chatIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" style="margin-left:0.5rem" fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16">
                <path  d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
            </svg>` //icons are paths to make for easier styling

  //login to attribute correct links
  if (!User.fromStorage()) {
    return [
      { label: 'Perfil', href: 'nan', icon: userIcon },
      { label: 'Tarefas', href: '../html/tasks.html', icon: taskIcon },
      { label: 'Chat', href: 'nan', icon: chatIcon }
    ];
  } else {
    return [
      { label: 'Perfil', href: '../html/user.html', icon: userIcon },
      { label: 'Tarefas', href: '../html/tasks.html', icon: taskIcon },
      { label: 'Chat', href: '../html/chat.html', icon: chatIcon }
    ];
  }
}

function changeModalContent(modal, type) { //changing modal content dynamically based on type
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  if (type === 'signup') { //signup form setup
    modal.querySelector('.modal-content').style.backgroundColor = '#fdfbf7';
    modalTitle.innerHTML = `
    <button type="button" class="btn p-0 border-0 back-to-login me-2">
    ←
    </button>
    Registar
    `;
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
    if (signupForm) { //listeners for form
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
        changeModalContent(modal, 'login'); //go back to login after register
      });
    }

    const backButton = modal.querySelector('.back-to-login');
    if (backButton) {
      backButton.addEventListener('click', function () {
        changeModalContent(modal, 'login');
      });
    }

  } else if (type === 'login') { //login form setup
    modalTitle.textContent = 'Log in';
    modal.querySelector('.modal-content').style.backgroundColor = '#fdfbf7';
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
    if (form) { //listeners for login
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
        User.saveToStorage(result.user);
        location.href = "tasks.html";

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
  //linking fonts used in app to make sure they load on every page
  let fonts = [document.createElement("link"), document.createElement("link"), document.createElement("link"), document.createElement("link")]
  fonts[0].href = "https://fonts.googleapis.com"
  fonts[0].rel = "preconnect"
  fonts[1].href = "https://fonts.gstatic.com"
  fonts[1].rel = "preconnect"
  fonts[1].crossOrigin = ""
  fonts[2].href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
  fonts[2].rel = "stylesheet"
  fonts[3].href = "https://fonts.cdnfonts.com/css/open-dyslexic"
  fonts[3].rel = "stylesheet"
  document.head.appendChild(fonts[0])
  document.head.appendChild(fonts[1])
  document.head.appendChild(fonts[2])
  document.head.appendChild(fonts[3])
  const url = new URLSearchParams(location.search);
  if (url.has('loggedOut')) { //if user is logged out, show login modal
    if (!document.querySelector('.login-modal')) {
      document.body.appendChild(createLoginModal());
    }
  }
});
