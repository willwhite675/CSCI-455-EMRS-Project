"use strict";
const createAccountForm = document.getElementById('createAccountForm');
const createAccountUsername = document.getElementById("username");
const createAccountPassword = document.getElementById("password");
const createAccountFirstName = document.getElementById("firstName");
const createAccountLastName = document.getElementById("lastName");
const createAccountPhoneNumber = document.getElementById("phoneNumber");
const createAccountEmail = document.getElementById("email");
const createAccountAge = document.getElementById("age");
const createAccountGender = document.getElementById("gender");
const backButton = document.getElementById("backButton");
function createAccount() {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    const firstName = createAccountFirstName.value;
    const lastName = createAccountLastName.value;
    const phoneNumber = createAccountPhoneNumber.value;
    const email = createAccountEmail.value;
    const age = parseInt(createAccountAge.value);
    const gender = createAccountGender.value;
    fetch("http://localhost:8001/create-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, firstName, lastName, phoneNumber, age, gender, email, userType: "Patient" })
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
