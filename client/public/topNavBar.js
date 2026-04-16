"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
    <h1 id="pageName"></h1>
    <nav class="topNavBar">
        <button class="topNavElement" id="shareButton">Share Records</button>
        <button class="topNavElement" id="printButton">Print</button>
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
        else if (currentPath.includes('/management-panel/')) {
            pageNameElement.textContent = 'Management Panel';
        }
    }
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', () => {
            alert("This is when the print window would open, and then the document would be printed.");
        });
    }
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            alert("This would connect to a third party service to share the records securely.");
        });
    }
});
