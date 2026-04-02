document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:8001/get-providers", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        const employeeTableBody = document.getElementById("employeeTableBody") as HTMLTableSectionElement;

        if (employeeTableBody) {
            for (let i = 0; i < data.providers.length; i++) {
                console.log(data.providers[i]);
                employeeTableBody.innerHTML += `
                <tr>
                    <td>${data.providers[i][0]}</td>
                    <td>${data.providers[i][1]}</td>
                    <td>${data.providers[i][2]}</td>
                </tr>
                `
            }
        }
    })
    .catch(error => {
        console.error("Error fetching providers:", error);
    });
})


