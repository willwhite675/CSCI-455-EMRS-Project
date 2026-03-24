function login() {
    window.location.href = "../dashboard/dashboard.html";
}

const loginButton = document.getElementById("loginButton");
loginButton?.addEventListener("click", login)