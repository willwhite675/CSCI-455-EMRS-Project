"use strict";
const accessToken3 = sessionStorage.getItem("access_token");
let myAppointmentData;
let myAppointmentDataTable;
let patientAppointmentData;
let patientAppointmentDataTable;
function getMyAppointments() {
    const appointmentTableBody = document.getElementById("appointmentTableBody");
    if (appointmentTableBody && myAppointmentData && myAppointmentData.appointments) {
        appointmentTableBody.innerHTML = '';
        myAppointmentData.appointments.forEach((appointment) => {
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
        });
        myAppointmentDataTable = $('#appointmentTable').DataTable();
    }
}
function getPatientAppointments() {
    const patientAppointmentTableBody = document.getElementById("patientAppointmentTableBody");
    if (patientAppointmentTableBody && patientAppointmentData && patientAppointmentData.appointments) {
        patientAppointmentTableBody.innerHTML = '';
        patientAppointmentData.appointments.forEach((appointment) => {
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
        });
        patientAppointmentDataTable = $('#patientAppointmentTable').DataTable({
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
                <button id="scheduleAppointmentButton" class="standardButton">Schedule Appointment</button>
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
    else if (userType === "Provider" || userType === "Admin") {
        appointMentHTML = `
            <div class="appointmentButtons">
                <button id="scheduleAppointmentButton" class="standardButton">Schedule Appointment</button>
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
    const appointments = document.getElementById('appointmentContainer');
    if (appointments) {
        appointments.innerHTML = appointMentHTML;
        // Set up dialog handlers after the HTML has been inserted
        setTimeout(() => {
            setupDialogHandlers();
        }, 0);
    }
});
function setupDialogHandlers() {
    const dialog = document.getElementById('addAppointmentDialog');
    const scheduleButton = document.getElementById('scheduleAppointmentButton');
    const closeButton = document.getElementById('closeAddAppointmentDialogButton');
    const form = document.getElementById('addAppointmentForm');
    const dateInput = document.getElementById('appointmentDate');
    // Set minimum date to today
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
    // Open dialog when Schedule Appointment button is clicked
    if (scheduleButton) {
        scheduleButton.addEventListener('click', () => {
            if (dialog) {
                // Reset min date each time dialog opens
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.setAttribute('min', today);
                }
                dialog.showModal();
            }
        });
    }
    // Close dialog when X button is clicked
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (dialog) {
                dialog.close();
                form?.reset();
            }
        });
    }
    // Handle form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const reason = document.getElementById('reason').value;
            const department = document.getElementById('department').value;
            const appointmentDate = document.getElementById('appointmentDate').value;
            const appointmentTime = document.getElementById('appointmentTime').value;
            // Validate that the date/time is not in the past
            const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
            const now = new Date();
            if (selectedDateTime < now) {
                alert('Cannot schedule appointments in the past. Please select a future date and time.');
                return;
            }
            const formData = {
                reason: reason,
                department: department,
                appointmentDate: appointmentDate,
                appointmentTime: appointmentTime
            };
            // Submit appointment data to your API
            fetch('http://localhost:8001/schedule-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken3}`
                },
                body: JSON.stringify(formData)
            })
                .then(response => response.json())
                .then(data => {
                if (data.success) {
                    console.log('Appointment scheduled successfully:', data);
                    alert('Appointment scheduled successfully!');
                    dialog.close();
                    form.reset();
                    // Refresh the appointments list
                    const userType = sessionStorage.getItem("userType");
                    if (userType === "Patient") {
                        // Reload appointments
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
                            if (myAppointmentDataTable) {
                                myAppointmentDataTable.destroy();
                            }
                            getMyAppointments();
                        });
                    }
                    else {
                        // Reload appointments
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
                            if (patientAppointmentDataTable) {
                                patientAppointmentDataTable.destroy();
                            }
                            getPatientAppointments();
                        });
                    }
                }
                else {
                    alert(data.message || 'Failed to schedule appointment. Please try again.');
                }
            })
                .catch(error => {
                console.error('Error scheduling appointment:', error);
                alert('Failed to schedule appointment. Please try again.');
            });
        });
    }
    // Close dialog when clicking outside of it
    if (dialog) {
        dialog.addEventListener('click', (e) => {
            const dialogDimensions = dialog.getBoundingClientRect();
            if (e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom) {
                dialog.close();
                form?.reset();
            }
        });
    }
}
