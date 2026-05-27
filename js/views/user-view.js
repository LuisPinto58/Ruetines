function loadUserInfo(){
    document.getElementById('user-email').textContent = `Email: ${JSON.parse(localStorage.getItem('user')).email}`;
}


window.onload = loadUserInfo;