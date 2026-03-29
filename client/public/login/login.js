"use strict";
const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;
    fetch("http://localhost:8001/login", {
        method: "POST",
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
});
