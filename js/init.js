function init(){
    if(!sessionStorage.getItem('token') && localStorage.getItem("userRole")){
        localStorage.removeItem("userRole");
        window.location.href = 'html/tasks.html?loggedOut=true';
    }else if(sessionStorage.getItem('token') && localStorage.getItem("userRole")){
        if(localStorage.getItem("userRole") === "admin"){
            window.location.href = 'html/adminTasks.html';
        }else{
            window.location.href = 'html/loggedTasks.html';
        }
    }
}

window.onload = init;