"use strict";
let theData;
function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody");
    if (employeeTableBody) {
        theData.providers.forEach((provider) => {
            employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.providerID}</td>
                    <td>${provider.departmentName}</td>
                    <td>${provider.departmentID}</td>
                </tr>
                `;
        });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
        theData = data;
        getProviders();
    })
        .catch(error => {
        console.error("Error fetching providers:", error);
    });
});
const departmentList = document.getElementById("departmentList");
if (departmentList) {
    theData.departments.forEach((department) => {
        departmentList.innerHTML += `
                <option value="${department.departmentID}">${department.departmentName}</option>
                `;
    });
}
