"use strict";
// Get the access token from sessionStorage
const accessToken = sessionStorage.getItem("access_token");
let patientData;
let patientDataTable = null;
let recentPatientVisits = null;
let recentPatientBilling = null;
let recentPatientLabResults = null;
const patientRecordView = document.getElementById("recordInfo");
let viewRecord = false;
function getPatients() {
    const patientTableBody = document.getElementById("patientTableBody");
    if (patientTableBody) {
        patientData.patients.forEach((patient) => {
            patientTableBody.innerHTML += `
                <tr class="dataRows">
                    <td>${patient.accountID}</td>
                    <td>${patient.lastName}, ${patient.firstName}</td>
                    <td>${patient.gender}</td>
                    <td>${formatDate(patient.DOB)}</td>
                    <td>${patient.phoneNumber}</td>
                    <td>${patient.email}</td>
                    <td>${patient.insuranceDetails}</td>
                </tr>
                `;
        });
        patientDataTable = $('#patientsTable').DataTable();
        attachRecordListeners();
    }
}
function attachRecordListeners() {
    const patientTableBody = document.getElementById("patientTableBody");
    if (patientTableBody) {
        patientTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr.dataRows');
            if (row) {
                const patientID = row.querySelector('td:first-child')?.textContent;
                viewRecord = true;
                hideTable();
                viewRecordHandler(patientID);
            }
        });
    }
}
function checkToken(response) {
    if (response.status === 401) {
        // Token invalid or expired, redirect to login
        sessionStorage.clear();
        window.location.href = "../login/login.html";
        throw new Error("Unauthorized");
    }
    if (response.status === 403) {
        alert("You don't have permission to view patients");
        window.location.href = "../login/login.html";
        throw new Error("Forbidden");
    }
    return response.json();
}
function viewRecordHandler(accountID) {
    console.log(accountID);
    if (!accountID) {
        alert("Invalid patient ID");
        return;
    }
    if (viewRecord) {
        let patientData;
        let patientAllergiesData;
        let patientMedicalHistoryData;
        let patientVisitsData;
        let patientBillingData;
        let patientLabResultsData;
        fetch(`http://localhost:8001/get-patient-by-id?accountID=${accountID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        })
            .then(response => {
            return checkToken(response);
        })
            .then(data => {
            patientData = data;
            return fetch(`http://localhost:8001/get-patient-allergies?patientID=${patientData.patientID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        })
            .then(response => response.json())
            .then(data => {
            patientAllergiesData = data;
            return fetch(`http://localhost:8001/get-patient-medical-history?patientID=${patientData.patientID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        })
            .then(response => response.json())
            .then(data => {
            patientMedicalHistoryData = data;
            return fetch(`http://localhost:8001/get-patient-visits?patientID=${patientData.patientID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        })
            .then(response => response.json())
            .then(data => {
            patientVisitsData = data;
            return fetch(`http://localhost:8001/get-patient-billing-history?patientID=${patientData.patientID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        })
            .then(response => response.json())
            .then(data => {
            patientBillingData = data;
            return fetch(`http://localhost:8001/get-patient-lab-results?patientID=${patientData.patientID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        })
            .then(response => response.json())
            .then(data => {
            patientLabResultsData = data;
        })
            .then(() => {
            patientRecordView.innerHTML = `
                    <div id="topRecordContainer">
                    <h1 id="patientName">${patientData.firstName} ${patientData.lastName}</h1>
                        <div id="backButtonContainer">
                            <button id="backButton" class="standardButton" onclick="backToPatients()">X</button>
                        </div>
                    </div>
                    <div class="record-row">
                        <div class="record-group">
                            <h2 class="patientInfoHeader">Patient Info</h2>
                            <span>
                                <p><b>ID</b>: ${patientData.patientID}</p>
                                <p><b>Phone</b> Number: ${patientData.phoneNumber}</p>
                                <p><b>Gender</b>: ${patientData.gender}</p>
                                <p><b>DOB</b>: ${patientData.DOB}</p>
                            </span>
                        </div>
                        <div class="record-group">
                            <h2 class="patientInfoHeader">Allergy Profile</h2>
                            <p>${patientAllergiesData?.allergies?.length > 0 ? patientAllergiesData.allergies.map((a) => `<p>${a[0]}</p>`).join('') : 'No allergy information'}</p>
                        </div>
                    </div>
                    <div class="record-row">
                        <div class="record-group">
                            <h2 class="patientInfoHeader">Insurance</h2>
                            <p>${patientData.insuranceDetails || 'No insurance information'}</p>
                        </div>
                        <div class="record-group">
                                <h2 class="patientInfoHeader">Medical History</h2>
                                <p>${patientMedicalHistoryData?.medicalHistory?.length > 0 ? patientMedicalHistoryData.medicalHistory.map((h) => `<p>${h.diagnosis}</p>`).join('') : 'No medical history'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="record-row">
                        <div class="record-group">
                            <h2>Recent Visits</h2>
                            <table id="recordTable">
                                <thead id="recordHeader">
                                    <tr id="recordLabels">
                                        <th>Date</th>
                                        <th>Purpose</th>
                                        <th>Doctor</th>
                                        <th>Walk-in</th>
                                    </tr>
                                </thead>
                                <tbody id="recordTableBody">
                    
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="record-row">
                        <div class="record-group">
                            <h2>Billing</h2>
                            <table id="billingTable">
                                <thead id="billingHeader">
                                    <tr id="billingLabels">
                                        <th>Bill ID</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="billingBody">
                                
                                </tbody>
                            </table>
                        </div>
                    </div>
                <div class="record-row">
                    <div class="record-group">
                        <h2>Lab Results</h2>
                        <table id="labResultsTable">
                            <thead id="labResultsHeader">
                                <tr id="labResultsLabels">
                                    <th>Lab ID</th>
                                    <th>Test Date</th>
                                    <th>Test Name</th>
                                    <th>Result</th>
                                    <th>Range</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody id="labResultsBody"></tbody>
                        </table>
</div>
</div>
                `;
        })
            .then(() => {
            const recordTableBody = document.getElementById("recordTableBody");
            const billingBody = document.getElementById("billingBody");
            const labResultsBody = document.getElementById("labResultsBody");
            patientVisitsData.visits.forEach((visit) => {
                let walkIn = visit.walkIn ? "Yes" : "No";
                const visitRow = `
                            <tr>
                                <td>${formatDate(visit.visitTimeStamp)}</td>
                                <td>${visit.purpose}</td>
                                <td>Dr. ${visit.lastName}</td>
                                <td>${walkIn}</td>
                            </tr>
                        `;
                recordTableBody?.insertAdjacentHTML("beforeend", visitRow);
            });
            patientBillingData.billingHistory.forEach((bill) => {
                const billRow = `
                            <tr>
                                <td>${bill.billingID}</td>
                                <td>${formatDate(bill.visitTimeStamp)}</td>
                                <td>${bill.amount}</td>
                                <td>${bill.status}</td>
                            </tr>
                        `;
                billingBody?.insertAdjacentHTML("beforeend", billRow);
            });
            patientLabResultsData.labResults.forEach((labResult) => {
                const labResultRow = `
                            <tr>
                                <td>${labResult.labResultID}</td>
                                <td>${formatDate(labResult.testDate)}</td>
                                <td>${labResult.testName}</td>
                                <td>${labResult.resultValue}</td>
                                <td>${labResult.referenceRange}</td>
                                <td>${labResult.status}</td>
                                <td>${labResult.notes}</td>
                            </tr>
                        `;
                labResultsBody?.insertAdjacentHTML("beforeend", labResultRow);
            });
            // Initialize DataTables after a small delay to ensure DOM is fully updated
            setTimeout(() => {
                recentPatientVisits = $('#recordTable').DataTable({
                    order: [[0, "desc"]],
                });
                recentPatientBilling = $('#billingTable').DataTable({
                    order: [[1, "desc"]],
                });
                recentPatientLabResults = $('#labResultsTable').DataTable({
                    order: [[1, "desc"]],
                });
            }, 0);
        })
            .catch(error => {
            console.error("Error fetching patient data:", error);
            alert("Failed to load patient record");
        });
    }
}
function hideTable() {
    const patientTable = document.getElementById("patientsTable_wrapper");
    patientTable.style.display = "none";
}
function backToPatients() {
    const patientTable = document.getElementById("patientsTable_wrapper");
    patientTable.style.display = "table";
    patientRecordView.innerHTML = "";
}
function formatDate(dateString) {
    return new Date(dateString).toISOString().split('T')[0];
}
document.addEventListener("DOMContentLoaded", () => {
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
        return checkToken(response);
    })
        .then(data => {
        patientData = data;
        getPatients();
    })
        .catch(error => {
        console.error("Error fetching patients:", error);
    });
});
