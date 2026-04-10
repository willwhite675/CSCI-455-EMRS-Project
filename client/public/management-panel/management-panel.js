"use strict";
let providerData;
let providerDataTable = null;
const addEmployeeID = document.getElementById("ID");
const addEmployeeProviderID = document.getElementById("providerID");
const addEmployeeDepartmentSelect = document.getElementById("departmentList");
const addEmployeeButton = document.getElementById('addEmployeeButton');
const addEmployeeDialog = document.getElementById('addEmployeeDialog');
function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody");
    if (employeeTableBody) {
        providerData.providers.forEach((provider) => {
            employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.lastName}, ${provider.firstName}</td>
                    <td>${provider.providerID}</td>
                    <td>${provider.departmentName}</td>
                    <td>${provider.departmentID}</td>
                    <td class="remove-column"><button class="removeButton">Remove</button></td>
                </tr>
                `;
        });
        providerDataTable = $('#employeeTable').DataTable();
        attachRemoveButtonListeners();
    }
}
function addEmployee() {
    const employeeID = addEmployeeID.value;
    const providerID = addEmployeeProviderID.value;
    const departmentID = addEmployeeDepartmentSelect.value;
    if (employeeID && providerID && departmentID) {
        fetch("http://localhost:8001/add-provider", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ employeeID, providerID, departmentID }),
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
    const removeButtons = document.querySelectorAll('.removeButton');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const employeeID = row?.querySelector('td:first-child')?.textContent;
            const name = row?.querySelector('td:nth-child(2)')?.textContent;
            if (employeeID && confirm(`Are you sure you want to remove ${name}?`)) {
                removeEmployee(employeeID);
            }
        });
    });
}
function removeEmployee(username) {
    fetch("http://localhost:8001/remove-provider", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username }),
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
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
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
