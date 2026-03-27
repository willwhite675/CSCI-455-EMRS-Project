document.addEventListener("DOMContentLoaded", function () {
    var navHTML = "\n    <h1 id=\"pageName\"></h1>\n    <nav class=\"topNavBar\">\n        <button class=\"topNavElement\">Share Records</button>\n        <button class=\"topNavElement\">Print</button>\n        <button class=\"topNavElement\">Edit Profile</button>\n    </nav>\n    ";
    var navBar = document.getElementById('topNavContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
    var currentPath = window.location.pathname;
    var pageNameElement = document.getElementById('pageName');
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
