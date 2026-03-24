document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
        <nav class="sidebar">
      <ul>
        <a href="../dashboard/dashboard.html" class="navLink">Dashboard</a>
        <a href="" class="navLink">Patients</a>
        <a href="" class="navLink">Appointments</a>
        <a href="" class="navLink">Lab Results</a>
        <a href="" class="navLink">Billing</a>
        <a href="" class="navLink">Settings</a>
      </ul>
    </nav>

    `;

    const navBar = document.getElementById('navContainer')
    if (navBar) {
        navBar.innerHTML = navHTML;
    }
});