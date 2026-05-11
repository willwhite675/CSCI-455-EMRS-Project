"use strict";
/*
 * Patient self-service profile editor.
 * - Loads current personal info from /get-self-by-id and /users/me
 * - Loads read-only medical data from /get-self-allergies and /get-self-medical-history
 * - Saves personal info via /update-self-info
 * - Changes password via /update-self-password
 */
const editProfileToken = sessionStorage.getItem("access_token");

function epCheckToken(response) {
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

function setStatus(elementId, message, isError) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("success", "error");
    el.classList.add(isError ? "error" : "success");
}

function loadProfile() {
    let userData;
    let patientData;
    let allergiesData;
    let medicalHistoryData;

    // 1) Account info (username, email)
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
            // 2) Patient row (name, DOB, phone, gender, insurance)
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
            // Populate read-only fields
            document.getElementById("readonlyUsername").textContent = userData.username || "";
            document.getElementById("readonlyDOB").textContent = patientData.DOB || "";

            // Populate editable fields
            document.getElementById("firstName").value = patientData.firstName || "";
            document.getElementById("lastName").value = patientData.lastName || "";
            document.getElementById("email").value = userData.email || "";
            document.getElementById("phoneNumber").value = patientData.phoneNumber || "";
            document.getElementById("gender").value = patientData.gender || "Male";
            document.getElementById("insurance").value = patientData.insuranceDetails || "";

            // Populate allergies (supports both old [tuple] and new {allergyID, allergen} shapes)
            const allergiesEl = document.getElementById("allergiesDisplay");
            if (allergiesData?.allergies?.length > 0) {
                allergiesEl.innerHTML = allergiesData.allergies
                    .map((a) => `<p>${a.allergen ?? a[0]}</p>`)
                    .join("");
            } else {
                allergiesEl.textContent = "No allergy information";
            }

            // Populate medical history
            const historyEl = document.getElementById("medicalHistoryDisplay");
            if (medicalHistoryData?.medicalHistory?.length > 0) {
                historyEl.innerHTML = medicalHistoryData.medicalHistory
                    .map((h) => `<p>${h.diagnosis}</p>`)
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

function savePersonalInfo(event) {
    event.preventDefault();
    setStatus("personalInfoStatus", "", false);

    const body = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phoneNumber: document.getElementById("phoneNumber").value.trim(),
        gender: document.getElementById("gender").value,
        insuranceDetails: document.getElementById("insurance").value.trim()
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
                return response.json().then(errorData => {
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
        .catch(error => {
            console.error("Error saving personal info:", error);
            const msg = error.detail || "Network or server error.";
            setStatus("personalInfoStatus", msg, true);
        });
}

function savePassword(event) {
    event.preventDefault();
    setStatus("passwordStatus", "", false);

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

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
                return response.json().then(errorData => {
                    throw { status: response.status, detail: errorData.detail };
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                setStatus("passwordStatus", "Password updated.", false);
                document.getElementById("passwordForm").reset();
            } else {
                setStatus("passwordStatus", data.message || "Update failed.", true);
            }
        })
        .catch(error => {
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

    // This page is patient-only; redirect others.
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
