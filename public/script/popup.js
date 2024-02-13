const addBtn = document.querySelector('.add-btn');
const popup = document.querySelector('.popup');
const closeBtn = document.querySelector('.close-btn');

function showPopup(event) {
    event.preventDefault();
    popup.style.display = 'flex';
}

function hidePopup(event) {
    event.preventDefault();
    popup.style.display = 'none';
}

addBtn.addEventListener('click', showPopup);
closeBtn.addEventListener('click', hidePopup);

// Function to display confirmation notification
function displayConfirmation() {
    // Display a confirmation modal or toast message
    // You can customize this part according to your preference
    // For example, you can use Bootstrap modal or a library like SweetAlert for nicer notifications
    alert("Subject deleted successfully!");
}