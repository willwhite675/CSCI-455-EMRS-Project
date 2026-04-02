"use strict";
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
        const employeeTableBody = document.getElementById("employeeTableBody");
        if (employeeTableBody) {
            data.providers.forEach((provider) => {
                employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.providerID}</td>
                    <td>${provider.departmentName}</td>
                </tr>
                `;
            });
        }
    })
        .catch(error => {
        console.error("Error fetching providers:", error);
    });
});
