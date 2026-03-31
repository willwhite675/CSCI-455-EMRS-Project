const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const loginUsername = document.getElementById("username") as HTMLInputElement;
const loginPassword = document.getElementById("password") as HTMLInputElement;
const createAccountButton = document.getElementById("createAccountButton") as HTMLButtonElement;

function login(): void {
    const username = loginUsername.value;
    const password = loginPassword.value;

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
            } else {
                alert(data.message ?? "Incorrect username or password");
            }
        })
        .catch((e) => {
            console.error(e);
            alert("Network or server error");
        });
}

loginPassword.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        login()
    }
})
createAccountButton.addEventListener("click", () => {
    window.location.href = "../create-account/create-account.html";
});
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login()

});