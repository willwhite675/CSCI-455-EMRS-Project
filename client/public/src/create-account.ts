const createAccountForm = document.getElementById('createAccountForm');
const createAccountUsername = document.getElementById("username") as HTMLInputElement;
const createAccountPassword = document.getElementById("password") as HTMLInputElement;
const createAccountFirstName = document.getElementById("firstName") as HTMLInputElement;
const createAccountLastName = document.getElementById("lastName") as HTMLInputElement;
const createAccountEmail = document.getElementById("email") as HTMLInputElement;

const backButton = document.getElementById("backButton") as HTMLButtonElement;

function createAccount() {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;
    const firstName = createAccountFirstName.value;
    const lastName = createAccountLastName.value;
    const email = createAccountEmail.value;

    fetch("http://localhost:8001/create-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, firstName, lastName, email, userType: "Patient" })
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