declare var $: any;

let patientData: any;

let patientDataTable = null;

function getPatients() {
    const patientTableBody = document.getElementById("patientTableBody") as HTMLTableSectionElement;
    if (patientTableBody) {
        patientData.patients.forEach((patient: any) => {
            patientTableBody.innerHTML += `
                <tr class="dataRows">
                    <td>${patient.ID}</td>
                    <td>${patient.lastName}, ${patient.firstName}</td>
                    <td>${patient.email}</td>
                    <td>${patient.allergyProfile}</td>
                    <td>${patient.insuranceDetails}</td>
                    <td>${patient.lastVisit}</td>
                </tr>
                `
        })
        patientDataTable = ($('#patientsTable') as any).DataTable();
        attachRecordListeners();
    }
}

function attachRecordListeners() {
    const dataRows = document.querySelectorAll('.dataRows');
    dataRows.forEach(tr => {
        tr.addEventListener('click', (e) => {
            const row = (e.target as HTMLElement).closest('tr');
            const patientID = row?.querySelector('td:first-child')?.textContent;
            //Open record of patient with patientID
        })
    })
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:8001/get-patients", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        patientData = data;
        getPatients();
    })
    .catch(error => {
        console.error("Error fetching patients:", error);
    });
});