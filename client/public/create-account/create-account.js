"use strict";
const createAccountForm = document.getElementById('createAccountForm');
const createAccountUsername = document.getElementById("username");
const createAccountPassword = document.getElementById("password");
const backButton = document.getElementById("backButton");
function createAccount() {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    fetch("http://localhost:8001/create-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, userType: "Patient" })
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            window.location.href = "../login/login.html";
        }
        else {
            alert(data.message ?? "Invalid credentials");
        }
    })
        .catch(() => {
        alert("Network or server error");
    });
}
if (createAccountForm)
    createAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        createAccount();
    });
backButton.addEventListener("click", () => {
    window.location.href = "../login/login.html";
});
