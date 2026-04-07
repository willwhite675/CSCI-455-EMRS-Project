let theData:any

function getProviders() {
    const employeeTableBody = document.getElementById("employeeTableBody") as HTMLTableSectionElement;
    if (employeeTableBody) {
        theData.providers.forEach((provider: any) => {
            employeeTableBody.innerHTML += `
                <tr>
                    <td>${provider.ID}</td>
                    <td>${provider.providerID}</td>
                    <td>${provider.departmentName}</td>
                </tr>
                `
        })
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
         theData = data
        getProviders()
    })
    .catch(error => {
        console.error("Error fetching providers:", error);
    });
})

