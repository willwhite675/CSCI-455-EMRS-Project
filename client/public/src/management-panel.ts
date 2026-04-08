let theData:any
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
                    <td><button class="removeButton">Remove</button></td>
                </tr>
                `
        })
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
                getProviders()
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