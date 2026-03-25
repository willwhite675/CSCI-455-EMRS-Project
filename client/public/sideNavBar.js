document.addEventListener("DOMContentLoaded", function () {
    var navHTML = "\n        <nav class=\"sideNavBar\">\n      <ul>\n        <a href=\"../dashboard/dashboard.html\" class=\"sideNavLink\">Dashboard</a>\n        <a href=\"../patients/patients.html\" class=\"sideNavLink\">Patients</a>\n        <a href=\"../appointments/appointments.html\" class=\"sideNavLink\">Appointments</a>\n        <a href=\"../lab-results/lab-results.html\" class=\"sideNavLink\">Lab Results</a>\n        <a href=\"../billing/billing.html\" class=\"sideNavLink\">Billing</a>\n        <a href=\"../settings/settings.html\" class=\"sideNavLink\">Settings</a>\n      </ul>\n        <a href=\"../login/login.html\" class=\"sideNavLink\" id=\"logout\">Logout</a>\n    </nav>\n    ";
    var navBar = document.getElementById('sideNavContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
});
