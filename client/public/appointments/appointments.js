"use strict";
const accessToken3 = sessionStorage.getItem("access_token");
let myAppointmentData;
let myAppointmentDataTable;
function getMyAppointments() {
    const appointmentTableBody = document.getElementById("appointmentTableBody");
    if (appointmentTableBody && myAppointmentData && myAppointmentData.appointments) {
        appointmentTableBody.innerHTML = '';
        myAppointmentData.appointments.forEach((appointment) => {
            const appointmentRow = `
                <tr>
                    <td>${appointment.appointmentID}</td>
                    <td>${appointment.doctorName}</td>
                    <td>${appointment.appointmentDate}</td>
                    <td>${appointment.appointmentTime}</td>
                    <td>${appointment.reason}</td>
                    <td>${appointment.status}</td>
                </tr>
            `;
            appointmentTableBody.innerHTML += appointmentRow;
        });
        myAppointmentDataTable = $('#appointmentTable').DataTable();
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const userType = sessionStorage.getItem("userType");
    let appointMentHTML = '';
    if (userType === "Patient") {
        appointMentHTML = `
            <div id="appointmentButtons">
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
    }
    else if (userType === "Provider") {
        appointMentHTML = `
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
    }
    if (userType === "Admin") {
        appointMentHTML = `
        
    `;
    }
    const appointments = document.getElementById('appointmentContainer');
    if (appointments) {
        appointments.innerHTML = appointMentHTML;
    }
});
