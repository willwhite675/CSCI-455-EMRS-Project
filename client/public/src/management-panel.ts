declare var $: any;

let theData:any
let dataTable: any = null;
const addEmployeeID = document.getElementById("ID") as HTMLInputElement;
const addEmployeeProviderID = document.getElementById("providerID") as HTMLInputElement;
const addEmployeeDepartmentSelect = document.getElementById("departmentList") as HTMLSelectElement;
const addEmployeeButton = document.getElementById('addEmployeeButton') as HTMLButtonElement;
const addEmployeeDialog = document.getElementById('addEmployeeDialog') as HTMLDialogElement;

function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody") as HTMLTableSectionElement;
    if (employeeTableBody) {
        theData.providers.forEach((provider: any) => {
            employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.providerID}</td>
                    <td>${provider.departmentName}</td>
                    <td>${provider.departmentID}</td>
                    <td class="remove-column"><button class="removeButton">Remove</button></td>
                </tr>
                `
        })
        dataTable = ($('#employeeTable') as any).DataTable();
        attachRemoveButtonListeners();
    }
}

function populateDepartments() {
    const departmentList = document.getElementById("departmentList") as HTMLSelectElement;
    if (departmentList && theData.departments) {
        theData.departments.forEach((department: any) => {
            departmentList.innerHTML += `
                <option value="${department.departmentID}">${department.departmentName}</option>
                `
        })
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

            if (employeeID && confirm(`Are you sure you want to remove employee ${employeeID}?`)) {
                removeEmployee(employeeID);
            }
        });
    });
}

function removeEmployee(username: string) {
    fetch("http://localhost:8001/remove-provider", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
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

document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
         theData = data
        getProviders()
    })
    .catch(error => {
        console.error("Error fetching providers:", error);
    });

    fetch("http://localhost:8001/get-departments", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            theData = { ...theData, ...data }
            populateDepartments()
        })
        .catch(error => {
            console.error("Error fetching departments:", error);
        });
})