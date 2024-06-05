document.addEventListener("DOMContentLoaded", function () {
    var statusText = document.getElementById("statusText");
    var taskStatuses = document.getElementById("taskStatuses");

    // Initially hide taskStatuses
    taskStatuses.style.display = "none";

    statusText.addEventListener("click", function () {
        // Toggle the display of taskStatuses
        if (taskStatuses.style.display === "block") {
            taskStatuses.style.display = "none";
            statusText.style.display = "block"; // Show statusText when taskStatuses is hidden
        } else {
            taskStatuses.style.display = "block";
            statusText.style.display = "none";
        }
    });

    taskStatuses.addEventListener("change", function () {
        taskStatuses.style.display = "none";
        statusText.style.display = "block";

        changeBackground();
        saveBackgroundColor();
    });

    changeBackground();
});

function changeBackground() {
    var selectElement = document.getElementById("taskStatuses");
    var selectedOption = selectElement.options[selectElement.selectedIndex];
    var selectWrapper = document.getElementById("selectWrapper");

    if (selectedOption.classList.contains("not-done")) {
        selectWrapper.style.backgroundColor = "#B5C0D0";
    } else if (selectedOption.classList.contains("in-progress")) {
        selectWrapper.style.backgroundColor = "#378CE7";
        selectWrapper.style.color = "#fff"; // Set font color to white for in-progress
    } else if (selectedOption.classList.contains("completed")) {
        selectWrapper.style.backgroundColor = "#198754";
        selectWrapper.style.color = "#fff"; // Set font color to white for completed
    }
}
function saveBackgroundColor() {
    var selectElement = document.getElementById("taskStatuses");
    var selectedOption = selectElement.options[selectElement.selectedIndex];
    var backgroundColor;
    var fontColor;

    if (selectedOption.classList.contains("not-done")) {
        backgroundColor = "#B5C0D0";
        fontColor = "#515761"; // Default font color
    } else if (selectedOption.classList.contains("in-progress")) {
        backgroundColor = "#378CE7";
        fontColor = "#fff"; // Font color for in-progress
    } else if (selectedOption.classList.contains("completed")) {
        backgroundColor = "#198754";
        fontColor = "#fff"; // Font color for completed
    }

    localStorage.setItem("backgroundColor", backgroundColor);
    localStorage.setItem("fontColor", fontColor);
}
var savedBackgroundColor = localStorage.getItem("backgroundColor");
var savedFontColor = localStorage.getItem("fontColor");
if (savedBackgroundColor) {
    var selectWrapper = document.getElementById("selectWrapper");
    selectWrapper.style.backgroundColor = savedBackgroundColor;
    selectWrapper.style.color = savedFontColor;
}


const taskDescription = document.getElementById("taskDescription");
const submitButtonContainer = document.getElementById("submitButtonContainer");

// Show the button container when the textarea is focused or has input
taskDescription.addEventListener('focus', function() {
    submitButtonContainer.style.display = "block";
});

taskDescription.addEventListener('input', function() {
    submitButtonContainer.style.display = "block";
});