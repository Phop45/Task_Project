function validateForm() {
    var taskName = document.getElementById("taskName").value.trim();
    if (taskName === "" || !isAlphanumeric(taskName)) {
        document.getElementById("notiAlert").style.display = "block"; // Display the general alert
        document.getElementById("notiAlertName").style.display = "none"; // Hide the specific name alert
        return false;
    }

    isDuplicated(taskName).then(duplicated => {
        if (duplicated) {
            // Show the specific name alert
            document.getElementById("notiAlertName").style.display = "block";
            // Hide the general alert
            document.getElementById("notiAlert").style.display = "none";
        } else {
            // Hide both alerts if the name is valid and not duplicated
            document.getElementById("notiAlert").style.display = "none";
            document.getElementById("notiAlertName").style.display = "none";
            // Allow form submission
            document.getElementById("updateTaskForm").submit();
        }
    });
    return false;
}

function isAlphanumeric(text) {
    return /^[a-zA-Z0-9ก-๙]+$/.test(text);
}