"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("http://localhost:8001/get-current-user", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    const currentUser = await response.json();
    const navHTML = `
        <nav class="sideNavBar">
      <ul>
        <a href="../dashboard/dashboard.html" class="sideNavLink">Dashboard</a>
        <a href="../patients/patients.html" class="sideNavLink">Patients</a>
        <a href="../appointments/appointments.html" class="sideNavLink">Appointments</a>
        <a href="../lab-results/lab-results.html" class="sideNavLink">Lab Results</a>
        <a href="../billing/billing.html" class="sideNavLink">Billing</a>
        <a href="../settings/settings.html" class="sideNavLink">Settings</a>
        <a href="../management-panel/management-panel.html" class="sideNavLink">Management Panel</a>
      </ul>
        <a href="../login/login.html" class="sideNavLink" id="logout">Logout</a>
    </nav>
    `;
    const navBar = document.getElementById('sideNavContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
});
