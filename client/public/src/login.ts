const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const loginUsername = document.getElementById("username") as HTMLInputElement;
const loginPassword = document.getElementById("password") as HTMLInputElement;
const createAccountButton = document.getElementById("createAccountButton") as HTMLButtonElement;

function login(): void {
    const username = loginUsername.value;
    const password = loginPassword.value;

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    fetch("http://localhost:8001/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Authentication failed");
            }
            return response.json();
        })
        .then(data => {
            // Store the access token in sessionStorage
            sessionStorage.setItem("access_token", data.access_token);
            sessionStorage.setItem("token_type", data.token_type);
            sessionStorage.setItem("isAdmin", String(data.is_admin));
            sessionStorage.setItem("userType", data.user_type);

            window.location.href = "../dashboard/dashboard.html";
        })
        .catch((e) => {
            console.error(e);
            alert("Incorrect username or password");
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