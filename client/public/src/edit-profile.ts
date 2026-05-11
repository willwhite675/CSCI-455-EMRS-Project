/*
 * Patient self-service profile editor.
 * - Loads current personal info from /get-self-by-id and /users/me
 * - Loads read-only medical data from /get-self-allergies and /get-self-medical-history
 * - Saves personal info via /update-self-info
 * - Changes password via /update-self-password
 */
const editProfileToken = sessionStorage.getItem("access_token");

function epCheckToken(response: Response) {
    if (response.status === 401) {
        sessionStorage.clear();
        window.location.href = "../login/login.html";
        throw new Error("Unauthorized");
    }
    if (response.status === 403) {
        alert("You don't have permission to view this page");
        window.location.href = "../login/login.html";
        throw new Error("Forbidden");
    }
    return response.json();
}

function setStatus(elementId: string, message: string, isError: boolean) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("success", "error");
    el.classList.add(isError ? "error" : "success");
}

function loadProfile() {
    let userData: any;
    let patientData: any;
    let allergiesData: any;
    let medicalHistoryData: any;

    fetch("http://localhost:8001/users/me", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${editProfileToken}`
        }
    })
        .then(response => epCheckToken(response))
        .then(data => {
            userData = data;
            return fetch("http://localhost:8001/get-self-by-id", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${editProfileToken}`
                }
            });
        })
        .then(response => response.json())
        .then(data => {
            patientData = data;
            return fetch("http://localhost:8001/get-self-allergies", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${editProfileToken}`
                }
            });
        })
        .then(response => response.json())
        .then(data => {
            allergiesData = data;
            return fetch("http://localhost:8001/get-self-medical-history", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${editProfileToken}`
                }
            });
        })
        .then(response => response.json())
        .then(data => {
            medicalHistoryData = data;
        })
        .then(() => {
            (document.getElementById("readonlyUsername") as HTMLElement).textContent = userData.username || "";
            (document.getElementById("readonlyDOB") as HTMLElement).textContent = patientData.DOB || "";

            (document.getElementById("firstName") as HTMLInputElement).value = patientData.firstName || "";
            (document.getElementById("lastName") as HTMLInputElement).value = patientData.lastName || "";
            (document.getElementById("email") as HTMLInputElement).value = userData.email || "";
            (document.getElementById("phoneNumber") as HTMLInputElement).value = patientData.phoneNumber || "";
            (document.getElementById("gender") as HTMLSelectElement).value = patientData.gender || "Male";
            (document.getElementById("insurance") as HTMLInputElement).value = patientData.insuranceDetails || "";

            const allergiesEl = document.getElementById("allergiesDisplay") as HTMLElement;
            if (allergiesData?.allergies?.length > 0) {
                allergiesEl.innerHTML = allergiesData.allergies
                    .map((a: any) => `<p>${a.allergen ?? a[0]}</p>`)
                    .join("");
            } else {
                allergiesEl.textContent = "No allergy information";
            }

            const historyEl = document.getElementById("medicalHistoryDisplay") as HTMLElement;
            if (medicalHistoryData?.medicalHistory?.length > 0) {
                historyEl.innerHTML = medicalHistoryData.medicalHistory
                    .map((h: any) => `<p>${h.diagnosis}</p>`)
                    .join("");
            } else {
                historyEl.textContent = "No medical history";
            }
        })
        .catch(error => {
            console.error("Error loading profile:", error);
            setStatus("personalInfoStatus", "Failed to load profile.", true);
        });
}

function savePersonalInfo(event: Event) {
    event.preventDefault();
    setStatus("personalInfoStatus", "", false);

    const body = {
        firstName: (document.getElementById("firstName") as HTMLInputElement).value.trim(),
        lastName: (document.getElementById("lastName") as HTMLInputElement).value.trim(),
        email: (document.getElementById("email") as HTMLInputElement).value.trim(),
        phoneNumber: (document.getElementById("phoneNumber") as HTMLInputElement).value.trim(),
        gender: (document.getElementById("gender") as HTMLSelectElement).value,
        insuranceDetails: (document.getElementById("insurance") as HTMLInputElement).value.trim()
    };

    fetch("http://localhost:8001/update-self-info", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${editProfileToken}`
        },
        body: JSON.stringify(body)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then((errorData: any) => {
                    throw { status: response.status, detail: errorData.detail };
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                setStatus("personalInfoStatus", "Saved.", false);
            } else {
                setStatus("personalInfoStatus", data.message || "Update failed.", true);
            }
        })
        .catch((error: any) => {
            console.error("Error saving personal info:", error);
            const msg = error.detail || "Network or server error.";
            setStatus("personalInfoStatus", msg, true);
        });
}

function savePassword(event: Event) {
    event.preventDefault();
    setStatus("passwordStatus", "", false);

    const currentPassword = (document.getElementById("currentPassword") as HTMLInputElement).value;
    const newPassword = (document.getElementById("newPassword") as HTMLInputElement).value;
    const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
        setStatus("passwordStatus", "New passwords do not match.", true);
        return;
    }
    if (newPassword.length < 1) {
        setStatus("passwordStatus", "New password cannot be empty.", true);
        return;
    }

    fetch("http://localhost:8001/update-self-password", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${editProfileToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then((errorData: any) => {
                    throw { status: response.status, detail: errorData.detail };
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                setStatus("passwordStatus", "Password updated.", false);
                (document.getElementById("passwordForm") as HTMLFormElement).reset();
            } else {
                setStatus("passwordStatus", data.message || "Update failed.", true);
            }
        })
        .catch((error: any) => {
            console.error("Error updating password:", error);
            const msg = error.detail || "Network or server error.";
            setStatus("passwordStatus", msg, true);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    if (!editProfileToken) {
        window.location.href = "../login/login.html";
        return;
    }

    const userType = sessionStorage.getItem("userType");
    if (userType && userType !== "Patient") {
        alert("Profile editing is only available for patient accounts.");
        window.location.href = "../dashboard/dashboard.html";
        return;
    }

    loadProfile();

    const personalForm = document.getElementById("personalInfoForm");
    if (personalForm) {
        personalForm.addEventListener("submit", savePersonalInfo);
    }

    const passwordForm = document.getElementById("passwordForm");
    if (passwordForm) {
        passwordForm.addEventListener("submit", savePassword);
    }
});
