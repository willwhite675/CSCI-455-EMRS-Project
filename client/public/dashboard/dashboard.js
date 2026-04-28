"use strict";
/*
* Essentially just a copy of patients.ts but all users can view their own information. The variables that have a 2 in them are just
* because they are duplicates of the other page and I didn't feel like really changing names so womp womp
*
* P.S. I probably should've used classes in all my TypeScript files, but I'm in way too deep now 🥲
*/
const accessToken2 = sessionStorage.getItem("access_token");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardContent = document.getElementById("recordInfo");
let recentVisitsTable = null;
let billingTable = null;
let labResultsTable = null;
function checkToken2(response) {
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
function loadPatientDashboard() {
    let patientData;
    let patientAllergiesData;
    let patientMedicalHistoryData;
    let patientVisitsData;
    let patientBillingData;
    let patientLabResultsData;
    fetch(`http://localhost:8001/get-self-by-id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken2}`
        }
    })
        .then(response => checkToken2(response))
        .then(data => {
        patientData = data;
        return fetch(`http://localhost:8001/get-self-allergies`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken2}`
            }
        });
    })
        .then(response => response.json())
        .then(data => {
        patientAllergiesData = data;
        return fetch(`http://localhost:8001/get-self-medical-history`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken2}`
            }
        });
    })
        .then(response => response.json())
        .then(data => {
        patientMedicalHistoryData = data;
        return fetch(`http://localhost:8001/get-self-visits`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken2}`
            }
        });
    })
        .then(response => response.json())
        .then(data => {
        patientVisitsData = data;
        return fetch(`http://localhost:8001/get-self-billing-history`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken2}`
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
                "Authorization": `Bearer ${accessToken2}`
            }
        });
    })
        .then(response => response.json())
        .then(data => {
        patientLabResultsData = data;
    })
        .then(() => {
        dashboardTitle.textContent = `Welcome ${patientData.firstName.charAt(0).toUpperCase() + patientData.firstName.slice(1)}!`;
        dashboardContent.innerHTML = `
                <div class="record-row">
                    <div class="record-group">
                        <h2 class="patientInfoHeader">Patient Info</h2>
                        <span>
                            <p><b>Name</b>: ${patientData.firstName} ${patientData.lastName}</p>
                            <p><b>ID</b>: ${patientData.patientID}</p>
                            <p><b>Phone Number</b>: ${patientData.phoneNumber}</p>
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
                <div class="record-row">
                    <div class="record-group">
                        <h2>Recent Visits</h2>
                        <table id="recentVisitsTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Purpose</th>
                                    <th>Doctor</th>
                                    <th>Walk-in</th>
                                </tr>
                            </thead>
                            <tbody id="visitsTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="record-row">
                    <div class="record-group">
                        <h2>Billing</h2>
                        <table id="billingTable">
                            <thead>
                                <tr>
                                    <th>Bill ID</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="billingTableBody">
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
        const visitsTableBody = document.getElementById("visitsTableBody");
        const billingTableBody = document.getElementById("billingTableBody");
        const labResultsBody = document.getElementById("labResultsBody");
        patientVisitsData.visits.forEach((visit) => {
            let walkIn = visit.walkIn ? "Yes" : "No";
            const visitRow = `
                    <tr>
                        <td>${formatDate2(visit.visitTimeStamp)}</td>
                        <td>${visit.purpose}</td>
                        <td>Dr. ${visit.lastName}</td>
                        <td>${walkIn}</td>
                    </tr>
                `;
            visitsTableBody?.insertAdjacentHTML("beforeend", visitRow);
        });
        patientBillingData.billingHistory.forEach((bill) => {
            const billRow = `
                    <tr>
                        <td>${bill.billingID}</td>
                        <td>${formatDate2(bill.visitTimeStamp)}</td>
                        <td>${bill.amount}</td>
                        <td>${bill.status}</td>
                    </tr>
                `;
            billingTableBody?.insertAdjacentHTML("beforeend", billRow);
        });
        patientLabResultsData.labResults.forEach((labResult) => {
            const labResultRow = `
                            <tr>
                                <td>${labResult.labResultID}</td>
                                <td>${formatDate2(labResult.testDate)}</td>
                                <td>${labResult.testName}</td>
                                <td>${labResult.resultValue}</td>
                                <td>${labResult.referenceRange}</td>
                                <td>${labResult.status}</td>
                                <td>${labResult.notes}</td>
                            </tr>
                        `;
            labResultsBody?.insertAdjacentHTML("beforeend", labResultRow);
        });
        setTimeout(() => {
            recentVisitsTable = $('#recentVisitsTable').DataTable({
                order: [[0, "desc"]],
            });
            billingTable = $('#billingTable').DataTable({
                order: [[1, "desc"]],
            });
            labResultsTable = $('#labResultsTable').DataTable({
                order: [[1, "desc"]],
            });
        }, 0);
    })
        .catch(error => {
        console.error("Error loading dashboard:", error);
        dashboardContent.innerHTML = `<p>Error loading patient information. Please try again later.</p>`;
    });
}
function formatDate2(dateString) {
    return new Date(dateString).toISOString().split('T')[0];
}
document.addEventListener("DOMContentLoaded", () => {
    if (!accessToken2) {
        window.location.href = "../login/login.html";
        return;
    }
    loadPatientDashboard();
});
