document.addEventListener("DOMContentLoaded", function () {
    var navHTML = "\n        <nav class=\"sidebar\">\n      <ul>\n        <a href=\"../dashboard/dashboard.html\" class=\"navLink\">Dashboard</a>\n        <a href=\"\" class=\"navLink\">Patients</a>\n        <a href=\"\" class=\"navLink\">Appointments</a>\n        <a href=\"\" class=\"navLink\">Lab Results</a>\n        <a href=\"\" class=\"navLink\">Billing</a>\n        <a href=\"\" class=\"navLink\">Settings</a>\n      </ul>\n    </nav>\n\n    ";
    var navBar = document.getElementById('navContainer');
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
});
