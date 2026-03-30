"use strict";
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("username");
const loginPassword = document.getElementById("password");
const createAccountButton = document.getElementById("createAccountButton");
function login() {
    const username = loginUsername.value;
    const password = loginPassword.value;
    fetch("http://localhost:8001/login", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            window.location.href = "../dashboard/dashboard.html";
        }
        else {
            alert(data.message ?? "Invalid credentials");
        }
    })
        .catch(() => {
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
