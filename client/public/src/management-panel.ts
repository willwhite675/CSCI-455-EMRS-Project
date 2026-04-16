
declare var $: any;

let providerData:any
let providerDataTable: any = null;
const addEmployeeID = document.getElementById("ID") as HTMLInputElement;
const addEmployeeProviderID = document.getElementById("providerID") as HTMLInputElement;
const addEmployeeDepartmentSelect = document.getElementById("departmentList") as HTMLSelectElement;
const addEmployeeButton = document.getElementById('addEmployeeButton') as HTMLButtonElement;
const addEmployeeDialog = document.getElementById('addEmployeeDialog') as HTMLDialogElement;

function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody") as HTMLTableSectionElement;
    if (employeeTableBody) {
        providerData.providers.forEach((provider: any) => {
            employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.lastName}, ${provider.firstName}</td>
                    <td>${provider.providerID}</td>
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

function addEmployee() {
    const employeeID = addEmployeeID.value;
    const providerID = addEmployeeProviderID.value;
    const departmentID = addEmployeeDepartmentSelect.value;
    const accessToken = sessionStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "../login/login.html";
        return;
    }

    if (employeeID && providerID && departmentID) {
        fetch("http://localhost:8001/add-provider", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({employeeID, providerID, departmentID}, ),
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
            const row = (e.target as HTMLElement).closest('tr');
            const employeeID = row?.querySelector('td:first-child')?.textContent;
            const name = row?.querySelector('td:nth-child(2)')?.textContent;

            if (employeeID && confirm(`Are you sure you want to remove ${name}?`)) {
                removeEmployee(employeeID);
            }
        });
    });
}

function removeEmployee(username: string) {
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
        body: JSON.stringify({username}),
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

    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                // Token invalid or expired, redirect to login
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