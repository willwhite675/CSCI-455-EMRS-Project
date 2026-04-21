"use strict";
const createAccountForm = document.getElementById('createAccountForm');
const createAccountUsername = document.getElementById("username");
const createAccountPassword = document.getElementById("password");
const createAccountFirstName = document.getElementById("firstName");
const createAccountLastName = document.getElementById("lastName");
const createAccountEmail = document.getElementById("email");
const createAccountPhoneNumber = document.getElementById("phoneNumber");
const createAccountDOB = document.getElementById("DOB");
const createAccountGender = document.getElementById("gender");
const createAccountInsurance = document.getElementById("insurance");
const backButton = document.getElementById("backButton");
const date = new Date();
const today = date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
createAccountDOB.max = today;
createAccountDOB.min = (date.getFullYear() - 150) + '-01-01';
console.log(today);
function createAccount() {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    const firstName = createAccountFirstName.value;
    const lastName = createAccountLastName.value;
    const phoneNumber = createAccountPhoneNumber.value;
    const email = createAccountEmail.value;
    const DOB = createAccountDOB.value;
    const gender = createAccountGender.value;
    const insuranceDetails = createAccountInsurance.value;
    fetch("http://localhost:8001/create-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, firstName, lastName, phoneNumber, DOB, gender, email, role: "Patient", insuranceDetails })
    })
        .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw { status: response.status, detail: errorData.detail };
            });
        }
        return response.json();
    })
        .then(data => {
        if (data.success) {
            window.location.href = "../login/login.html";
        }
        else {
            alert(data.message ?? "Invalid credentials");
        }
    })
        .catch((error) => {
        if (error.status === 400) {
            alert(error.detail || "User already exists");
        }
        else if (error.status === 500) {
            alert("Server error occurred. Please try again later.");
        }
        else {
            alert("Network or server error");
        }
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
