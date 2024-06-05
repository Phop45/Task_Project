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


// input script
function validateForm() {
    var subName = document.getElementById("SubName").value;

    if (subName.trim() === "" || !isAlphanumeric(subName.charAt(0))) {
        document.getElementById("notiAlert").style.display = "block";
        return false;
    }
    return true;
}
function isAlphanumeric(char) {
    return /^[a-zA-Z0-9ก-๙]+$/.test(char);
}

function clearFields() {
    document.getElementById("SubName").value = "";
    document.getElementById("SubDescription").value = "";
    document.getElementById("notiSubName").style.display = "none";
}
document.getElementById("SubName").addEventListener("focus", function() {
    document.getElementById("notiAlert").style.display = "none";
});

