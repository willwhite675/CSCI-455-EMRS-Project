"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const userType = sessionStorage.getItem("userType");
    let navHTML = `
        <nav class="sideNavBar">
      <ul>
        <a href="../dashboard/dashboard.html" class="sideNavLink">Dashboard</a>
        <a href="../appointments/appointments.html" class="sideNavLink">Appointments</a>
        <a href="../billing/billing.html" class="sideNavLink">Billing</a>
        <a href="../settings/settings.html" class="sideNavLink">Settings</a>
      </ul>
        <a href="../login/login.html" class="sideNavLink" id="logout">Logout</a>
    </nav>
    `;
    if (userType === "Provider") {
        navHTML = `
        <nav class="sideNavBar">
      <ul>
        <a href="../dashboard/dashboard.html" class="sideNavLink">Dashboard</a>
        <a href="../patients/patients.html" class="sideNavLink">Patients</a>
        <a href="../appointments/appointments.html" class="sideNavLink">Appointments</a>
        <a href="../billing/billing.html" class="sideNavLink">Billing</a>
        <a href="../settings/settings.html" class="sideNavLink">Settings</a>
      </ul>
        <a href="../login/login.html" class="sideNavLink" id="logout">Logout</a>
    </nav>
    `;
    }
    // Admin gets all links including management panel and patients
    if (userType === "Admin") {
        navHTML = `
        <nav class="sideNavBar">
      <ul>
        <a href="../dashboard/dashboard.html" class="sideNavLink">Dashboard</a>
        <a href="../patients/patients.html" class="sideNavLink">Patients</a>
        <a href="../appointments/appointments.html" class="sideNavLink">Appointments</a>
        <a href="../billing/billing.html" class="sideNavLink">Billing</a>
        <a href="../management-panel/management-panel.html" class="sideNavLink">Management Panel</a>
        <a href="../settings/settings.html" class="sideNavLink">Settings</a>
      </ul>
        <a href="../login/login.html" class="sideNavLink" id="logout">Logout</a>
    </nav>
    `;
    }
    const navBar = document.getElementById('sideNavContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
        });
    }
});
