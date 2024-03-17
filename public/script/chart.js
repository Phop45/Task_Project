window.onload = function() {
    window.scrollTo(0, 0);
};
// Data for the donut chart
var data = {
    labels: ['กำลังทำ','งานที่เสร็จสิ้น','งานที่ต้องแก้'],
    datasets: [{
        data: [30, 40, 30],
        backgroundColor: ['#F0C274','#9BCF53', '#FF6868'],
        hoverBackgroundColor: ['#ffce56','#BFEA7C','#FF8F8F']
    }]
};
// Options for the donut chart
var options = {
    cutoutPercentage: 60,
    responsive: false,
    plugins: {
        legend: {
            position: 'bottom',
            align: 'start',
            labels: {
                font: {
                    size: '16px'
                },
                maxRows: 3
            },
            fullWidth: true
        }
    }
};
// Get the canvas element
var ctx = document.getElementById('myDonutChart').getContext('2d');
// Create the donut chart
var myDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
});

document.getElementById('new-task-btn').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('sidebar-popup').classList.toggle('show-sidebar');
    document.getElementById('overlay').classList.toggle('show-overlay');
});

document.getElementById("close-task-btn").addEventListener("click", function() {
    document.getElementById("sidebar-popup").classList.remove("show-sidebar");
    document.getElementById("sidebar-popup").classList.add("hide-sidebar");
    document.getElementById("overlay").classList.remove("show-overlay");
    document.getElementById("overlay").classList.add("hide-overlay");
});


// Function to display calendar on input click
document.getElementById('datepicker').addEventListener('click', function() {
    this.type = 'date';
    this.focus();
});

$(document).ready(function() {
    $('#datepicker').datepicker({
        dateFormat: 'dd/mm/yy', // Set the date format
        changeMonth: true, // Enable month selection
        changeYear: true // Enable year selection
    });
});

function clearFields() {
document.getElementById("taskName").value = "";
document.getElementById("datepicker").value = "";
document.getElementById("taskTag").value = "";
document.getElementById("detail").value = "";
}