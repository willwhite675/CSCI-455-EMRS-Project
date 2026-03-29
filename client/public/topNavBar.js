"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
    <h1 id="pageName"></h1>
    <nav class="topNavBar">
        <button class="topNavElement">Share Records</button>
        <button class="topNavElement">Print</button>
        <button class="topNavElement">Edit Profile</button>
    </nav>
    `;
    const navBar = document.getElementById('topNavContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
    const currentPath = window.location.pathname;
    const pageNameElement = document.getElementById('pageName');
    if (pageNameElement) {
        if (currentPath.includes('/dashboard/')) {
            pageNameElement.textContent = 'Dashboard';
        }
        else if (currentPath.includes('/billing/')) {
            pageNameElement.textContent = 'Billing';
        }
        else if (currentPath.includes('/patients/')) {
            pageNameElement.textContent = 'Patients';
        }
        else if (currentPath.includes('/appointments/')) {
            pageNameElement.textContent = 'Appointments';
        }
        else if (currentPath.includes('/lab-results/')) {
            pageNameElement.textContent = 'Lab Results';
        }
        else if (currentPath.includes('/settings/')) {
            pageNameElement.textContent = 'Settings';
        }
        else if (currentPath.includes('/login/')) {
            pageNameElement.textContent = 'Login';
        }
    }
});
