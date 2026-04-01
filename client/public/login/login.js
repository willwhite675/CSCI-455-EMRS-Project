"use strict";
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("username");
const loginPassword = document.getElementById("password");
const createAccountButton = document.getElementById("createAccountButton");
function login() {
    const username = loginUsername.value;
    const password = loginPassword.value;
    fetch("http://localhost:8001/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, })
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            //Keeping this in the session data isn't good security practice, but this is just for demonstration.
            //In reality, you would create a token and then check the token
            sessionStorage.setItem("isAdmin", String(data.isAdmin));
            window.location.href = "../dashboard/dashboard.html";
        }
        else {
            alert(data.message ?? "Incorrect username or password");
        }
    })
        .catch((e) => {
        console.error(e);
        alert("Network or server error");
    });
}
loginPassword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        login();
    }
});
createAccountButton.addEventListener("click", () => {
    window.location.href = "../create-account/create-account.html";
});
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login();
});
