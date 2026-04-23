
declare var $: any;

let providerData:any
let providerDataTable: any = null;
const addAccountID = document.getElementById("ID") as HTMLInputElement;
const addEmployeeSpecialty = document.getElementById("specialty") as HTMLInputElement;
const addEmployeeRole = document.getElementById("roleList") as HTMLSelectElement;
const addEmployeeDepartmentSelect = document.getElementById("departmentList") as HTMLSelectElement;
const addEmployeeButton = document.getElementById('addEmployeeButton') as HTMLButtonElement;
const addEmployeeDialog = document.getElementById('addEmployeeDialog') as HTMLDialogElement;

function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody") as HTMLTableSectionElement;
    if (employeeTableBody) {
        providerData.providers.forEach((provider: any) => {
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
                `
        })
        providerDataTable = ($('#employeeTable') as any).DataTable();
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
                data.departments.forEach((dept: any) => {
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
            body: JSON.stringify({accountID, specialty, providerType, departmentID}, ),
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
    if (!employeeTableBody) return;

    employeeTableBody.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('removeButton')) {
            const row = target.closest('tr');
            if (!row) return;

            const accountID = row.getAttribute('data-account-id');
            const name = row.querySelector('td:first-child')?.textContent;

            if (accountID && confirm(`Are you sure you want to remove ${name}?`)) {
                removeEmployee(accountID);
            }
        }
    });
}

function removeEmployee(accountID: string) {
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
        body: JSON.stringify({accountID}),
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
            providerData = data
            getProviders()
        })
        .catch(error => {
            console.error("Error fetching providers:", error);
        });
})

if (addEmployeeButton && addEmployeeDialog) {
    addEmployeeButton.addEventListener('click', () => {
        addEmployeeDialog.showModal();
    });
}

const addEmployeeForm = document.getElementById('addEmployeeForm') as HTMLFormElement;
addEmployeeForm?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    addEmployee();

})

const closeEmployeeForm = document.getElementById(("closeAddEmployeeDialogButton")) as HTMLButtonElement;
closeEmployeeForm?.addEventListener('click', () => {
    addEmployeeDialog.close();
})