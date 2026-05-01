
declare var $: any;
const accessToken3 = sessionStorage.getItem("access_token");

let myAppointmentData: any;
let myAppointmentDataTable: any;
let patientAppointmentData: any;
let patientAppointmentDataTable: any;

function getMyAppointments() {
    const appointmentTableBody = document.getElementById("appointmentTableBody");
    if (appointmentTableBody && myAppointmentData && myAppointmentData.appointments) {
        appointmentTableBody.innerHTML = '';
        myAppointmentData.appointments.forEach((appointment: any) => {
            const appointmentRow = `
                <tr>
                    <td>${appointment.appointmentID}</td>
                    <td>${appointment.providerLastName}</td>
                    <td>${appointment.appointmentDate}</td>
                    <td>${appointment.appointmentTime}</td>
                    <td>${appointment.reason}</td>
                    <td>${appointment.status}</td>
                </tr>
            `;
            appointmentTableBody.innerHTML += appointmentRow;
        })
        myAppointmentDataTable = ($('#appointmentTable') as any).DataTable();
    }
}

function getPatientAppointments() {
    const patientAppointmentTableBody = document.getElementById("patientAppointmentTableBody");
    if (patientAppointmentTableBody && patientAppointmentData && patientAppointmentData.appointments) {
        patientAppointmentTableBody.innerHTML = '';
        patientAppointmentData.appointments.forEach((appointment: any) => {
            const appointmentRow = `
                <tr>
                    <td>${appointment.appointmentID}</td>
                    <td>${appointment.patientFirstName}</td>
                    <td>${appointment.providerLastName}</td>
                    <td>${appointment.appointmentDate}</td>
                    <td>${appointment.appointmentTime}</td>
                    <td>${appointment.reason}</td>
                    <td>${appointment.status}</td>
                </tr>
            `;
            patientAppointmentTableBody.innerHTML += appointmentRow;
        })
        patientAppointmentDataTable = ($('#patientAppointmentTable') as any).DataTable({
            "order": [[3, "desc"]]
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userType = sessionStorage.getItem("userType");
    let appointMentHTML = '';

    if (userType === "Patient") {
        appointMentHTML = `
            <div class="appointmentButtons">
                <button class="standardButton">Schedule Appointment</button>
                <button class="standardButton">Requested Appointments</button>
            </div>
            <table id="appointmentTable">
                    <thead>
                        <tr>
                            <th>Appointment ID</th>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="appointmentTableBody"></tbody>
               </table>
    `;
        fetch(`http://localhost:8001/get-self-appointments`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken3}`
            }
        })
            .then(data => data.json())
            .then(data => {
                myAppointmentData = data;
                getMyAppointments();
            })
            .catch(error => {
                console.error('Error fetching appointments:', error);
            });
    } else if (userType === "Provider" || userType === "Admin") {
        appointMentHTML = `
            <div class="appointmentButtons">
                <button class="standardButton">Schedule Appointment</button>
                <button class="standardButton">Requested Appointments</button>
            </div>
            <table id="patientAppointmentTable">
                <thead>
                    <tr>
                        <th>Appointment ID</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="patientAppointmentTableBody"></tbody>
            </table>
    `;
        fetch(`http://localhost:8001/get-patient-appointments`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken3}`
            }
        })
            .then(data => data.json())
            .then(data => {
                patientAppointmentData = data;
                getPatientAppointments();
            })
        .catch(error => {
            console.error('Error fetching appointments:', error);
        });
    }

    const appointments = document.getElementById('appointmentContainer')
    if (appointments) {
        appointments.innerHTML = appointMentHTML;
    }
});