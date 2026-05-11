
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
    } else if (userType === "Provider" || userType === "Admin") {
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

    const appointments = document.getElementById('appointmentContainer')
    if (appointments) {
        appointments.innerHTML = appointMentHTML;

        setTimeout(() => {
            setupDialogHandlers();
        }, 0);
    }
});

function setupDialogHandlers() {
    const dialog = document.getElementById('addAppointmentDialog') as HTMLDialogElement;
    const scheduleButton = document.getElementById('scheduleAppointmentButton');
    const closeButton = document.getElementById('closeAddAppointmentDialogButton');
    const form = document.getElementById('addAppointmentForm') as HTMLFormElement;
    const dateInput = document.getElementById('appointmentDate') as HTMLInputElement;

    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    if (scheduleButton) {
        scheduleButton.addEventListener('click', () => {
            if (dialog) {
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.setAttribute('min', today);
                }
                dialog.showModal();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (dialog) {
                dialog.close();
                form?.reset();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const reason = (document.getElementById('reason') as HTMLInputElement).value;
            const department = (document.getElementById('department') as HTMLSelectElement).value;
            const appointmentDate = (document.getElementById('appointmentDate') as HTMLInputElement).value;
            const appointmentTime = (document.getElementById('appointmentTime') as HTMLInputElement).value;

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
                        const userType = sessionStorage.getItem("userType");
                        if (userType === "Patient") {
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
                        } else {
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
                    } else {
                        alert(data.message || 'Failed to schedule appointment. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error scheduling appointment:', error);
                    alert('Failed to schedule appointment. Please try again.');
                });
        });
    }

    if (dialog) {
        dialog.addEventListener('click', (e) => {
            const dialogDimensions = dialog.getBoundingClientRect();
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                dialog.close();
                form?.reset();
            }
        });
    }
}