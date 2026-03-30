const createAccountForm = document.querySelector('.create-account-form');
const createAccountUsername = document.getElementById("username") as HTMLInputElement;
const createAccountPassword = document.getElementById("password") as HTMLInputElement;

function createAccount() {
    const username = createAccountUsername.value;
    const password = createAccountPassword.value;

    fetch("http://localhost:8001/create-account", {
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
}
if (createAccountForm)
    createAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        createAccount();
    });