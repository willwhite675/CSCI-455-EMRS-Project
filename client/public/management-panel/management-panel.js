"use strict";
let providerData;
let providerDataTable = null;
const addAccountID = document.getElementById("ID");
const addEmployeeSpecialty = document.getElementById("specialty");
const addEmployeeRole = document.getElementById("roleList");
const addEmployeeDepartmentSelect = document.getElementById("departmentList");
const addEmployeeButton = document.getElementById('addEmployeeButton');
const addEmployeeDialog = document.getElementById('addEmployeeDialog');
function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody");
    if (employeeTableBody) {
        providerData.providers.forEach((provider) => {
            if (provider.accountID == sessionStorage.getItem("access_token")) {
                employeeTableBody.innerHTML += `
                    <tr data-account-id="${provider.accountID}">
                        <td>${provider.lastName}, ${provider.firstName}</td>
                        <td>${provider.email}</td>
                        <td>${provider.providerID}</td>
                        <td>${provider.providerType}</td>
                        <td>${provider.specialty}</td>
                        <td>${provider.departmentName}</td>
                        <td>${provider.departmentID}</td>
                        <td></td>
                    </tr>
                `;
            }
            else {
                employeeTableBody.innerHTML += `
                    <tr data-account-id="${provider.accountID}">
                        <td>${provider.lastName}, ${provider.firstName}</td>
                        <td>${provider.email}</td>
                        <td>${provider.providerID}</td>
                        <td>${provider.providerType}</td>
                        <td>${provider.specialty}</td>
                        <td>${provider.departmentName}</td>
                        <td>${provider.departmentID}</td>
                        <td class="remove-column"><button class="removeButton">Remove</button></td>
                    </tr>
                `;
            }
        });
        providerDataTable = $('#employeeTable').DataTable();
        attachRemoveButtonListeners();
    }
}
function loadDepartments() {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = "../login/login.html";
        return;
    }
    fetch("http://localhost:8001/get-departments", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    })
        .then(response => {
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = "../login/login.html";
            alert("Invalid credentials");
            throw new Error("Unauthorized");
        }
        if (response.status === 403) {
            alert("You don't have permission to view departments");
            window.location.href = "../login/login.html";
            throw new Error("Forbidden");
        }
        return response.json();
    })
        .then(data => {
        if (data.departments) {
            data.departments.forEach((dept) => {
                const option = document.createElement('option');
                option.value = dept.departmentID;
                option.textContent = dept.departmentName;
                addEmployeeDepartmentSelect.appendChild(option);
            });
        }
    })
        .catch(error => {
        console.error("Error fetching departments:", error);
    });
}
function addEmployee() {
    const accountID = addAccountID.value;
    const specialty = addEmployeeSpecialty.value;
    const providerType = addEmployeeRole.value;
    const departmentID = addEmployeeDepartmentSelect.value;
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = "../login/login.html";
        return;
    }
    if (accountID && departmentID && specialty && providerType) {
        fetch("http://localhost:8001/add-provider", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ accountID, specialty, providerType, departmentID }),
        })
            .then(response => response.json())
            .then(data => {
            if (data.success) {
                addEmployeeDialog.close();
                location.reload();
            }
            else {
                alert(data.message ?? "Failed to add employee");
            }
        })
            .catch(error => {
            console.error("Error adding employee:", error);
        });
    }
}
function attachRemoveButtonListeners() {
    const employeeTableBody = document.getElementById('employeeTableBody');
    if (!employeeTableBody)
        return;
    employeeTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('removeButton')) {
            const row = target.closest('tr');
            if (!row)
                return;
            const accountID = row.getAttribute('data-account-id');
            const name = row.querySelector('td:first-child')?.textContent;
            if (accountID && confirm(`Are you sure you want to remove ${name}?`)) {
                removeEmployee(accountID);
            }
        }
    });
}
function removeEmployee(accountID) {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = "../login/login.html";
        return;
    }
    fetch("http://localhost:8001/remove-provider", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ accountID }),
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            location.reload();
        }
        else {
            alert(data.message ?? "Failed to remove employee");
        }
    })
        .catch(error => {
        console.error("Error removing employee:", error);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = "../login/login.html";
        return;
    }
    loadDepartments();
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    })
        .then(response => {
        if (response.status === 401) {
            // Token invalid or expired, redirect to log in
            sessionStorage.clear();
            window.location.href = "../login/login.html";
            alert("Invalid credentials");
            throw new Error("Unauthorized");
        }
        if (response.status === 403) {
            alert("You don't have permission to view employees");
            window.location.href = "../login/login.html";
            throw new Error("Forbidden");
        }
        return response.json();
    })
        .then(data => {
        providerData = data;
        getProviders();
    })
        .catch(error => {
        console.error("Error fetching providers:", error);
    });
});
if (addEmployeeButton && addEmployeeDialog) {
    addEmployeeButton.addEventListener('click', () => {
        addEmployeeDialog.showModal();
    });
}
const addEmployeeForm = document.getElementById('addEmployeeForm');
addEmployeeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    addEmployee();
});
const closeEmployeeForm = document.getElementById(("closeAddEmployeeDialogButton"));
closeEmployeeForm?.addEventListener('click', () => {
    addEmployeeDialog.close();
});
