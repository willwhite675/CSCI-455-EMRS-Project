"use strict";
let patientData;
let patientDataTable = null;
const addPatientButton = document.getElementById("addPatientButton");
const addPatientDialog = document.getElementById("addPatientDialog");
function getPatients() {
    const patientTableBody = document.getElementById("patientTableBody");
    if (patientTableBody) {
        patientData.patients.forEach((patient) => {
            patientTableBody.innerHTML += `
                <tr class="dataRows">
                    <td>${patient.ID}</td>
                    <td>${patient.lastName}, ${patient.firstName}</td>
                    <td>${patient.email}</td>
                    <td>${patient.allergyProfile}</td>
                    <td>${patient.insuranceDetails}</td>
                    <td>${patient.lastVisit}</td>
                </tr>
                `;
        });
        patientDataTable = $('#patientsTable').DataTable();
        attachRecordListeners();
    }
}
function attachRecordListeners() {
    const dataRows = document.querySelectorAll('.dataRows');
    dataRows.forEach(tr => {
        tr.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const patientID = row?.querySelector('td:first-child')?.textContent;
            //Open record of patient with patientID
        });
    });
}
function addPatient() {
}
document.addEventListener("DOMContentLoaded", () => {
    // Get the access token from sessionStorage
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
        // Redirect to login if no token
        window.location.href = "../login/login.html";
        return;
    }
    fetch("http://localhost:8001/get-patients", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    })
        .then(response => {
        if (response.status === 401) {
            // Token invalid or expired, redirect to login
            sessionStorage.clear();
            window.location.href = "../login/login.html";
            throw new Error("Unauthorized");
        }
        if (response.status === 403) {
            alert("You don't have permission to view patients");
            window.location.href = "../dashboard/dashboard.html";
            throw new Error("Forbidden");
        }
        return response.json();
    })
        .then(data => {
        patientData = data;
        getPatients();
    })
        .catch(error => {
        console.error("Error fetching patients:", error);
    });
});
if (addPatientButton)
    addPatientButton.addEventListener('click', () => {
        addPatientDialog.showModal();
    });
const addPatientForm = document.getElementById('addPatientForm');
addPatientForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    addPatient();
});
const closePatientForm = document.getElementById(("closeAddPatientDialogButton"));
closePatientForm?.addEventListener('click', () => {
    addPatientDialog.close();
});
