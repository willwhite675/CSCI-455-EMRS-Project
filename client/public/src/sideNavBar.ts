document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
        <nav class="sideNavBar">
      <ul>
        <a href="../dashboard/dashboard.html" class="sideNavLink">Dashboard</a>
        <a href="../patients/patients.html" class="sideNavLink">Patients</a>
        <a href="../appointments/appointments.html" class="sideNavLink">Appointments</a>
        <a href="../lab-results/lab-results.html" class="sideNavLink">Lab Results</a>
        <a href="../billing/billing.html" class="sideNavLink">Billing</a>
        <a href="../settings/settings.html" class="sideNavLink">Settings</a>
      </ul>
    </nav>
    `;

    const navBar = document.getElementById('sideNavContainer')
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
});