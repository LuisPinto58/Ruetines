function init(){
    if(!sessionStorage.getItem('token') && localStorage.getItem("userRole")){
        localStorage.removeItem("userRole");
        window.location.href = 'tasks.html?loggedOut=true';
    }else if(sessionStorage.getItem('token') && localStorage.getItem("userRole")){
        if(localStorage.getItem("userRole") === "admin"){
            window.location.href = 'adminTasks.html';
        }else{
            window.location.href = 'loggedTasks.html';
        }
    }
}

window.onload = init;