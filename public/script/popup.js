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