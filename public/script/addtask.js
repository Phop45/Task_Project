function validateForm() {
    var taskname = document.forms["taskForm"]["taskname"].value;
    var taskdetail = document.forms["taskForm"]["taskdetail"].value;

    if (taskname == "" || taskdetail == "") {
        alert("กรุณากรอกทุกช่อง");
        return false;
    }

    // Check if there is at least one task in the list
    var taskList = document.getElementById("list-addtodo").getElementsByTagName("li");
    if (taskList.length === 0) {
        alert("กรุณาเพิ่มลิสต์");
        return false;
    }

    // Clear the value in the taskname input field
    document.forms["taskForm"]["taskname"].value = "";

    // ถ้าต้องการป้องกันการ submit form ให้ return true
    // หรือถ้าต้องการให้ form ไปยัง action="/addTask" ให้ return true
    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////
//add_todo
const inputBox = document.getElementById("input-box");
const listAddtodo = document.getElementById("list-addtodo");

function addTodo() {
    if (inputBox.value == '') {
        alert("You must write something!");
    } else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listAddtodo.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);

        // บันทึกข้อมูลลิสต์ที่เพิ่มลงใน localStorage
        saveData();

        // เพิ่มข้อมูลลิสต์ลงใน hidden input เพื่อส่งไปที่เซิร์ฟเวอร์
        appendListToHiddenInput(inputBox.value);
    }
    inputBox.value = "";
}

listAddtodo.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked-todo");
        saveData();
    }
    else if (e.target.tagName === "SPAN") {
        e.target.parentElement.remove();
        saveData();
    }
}, false);

function saveData() {
    localStorage.setItem("data", listAddtodo.innerHTML);
}

function appendListToHiddenInput(listItem) {
    // ดึง hidden input และเพิ่มข้อมูลลิสต์เข้าไป
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "listaddtodo"; // ชื่อ field ที่ต้องการให้เซิร์ฟเวอร์รับค่า
    hiddenInput.value = listItem;
    document.getElementById("taskForm").appendChild(hiddenInput);
}

function showTask() {
    listAddtodo.innerHTML = localStorage.getItem("data");
}
showTask();

///////////////////////////////////////////////////////////////////////////
//aad_file
document.getElementById('myfile').addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const fileList = event.target.files;
    const fileUl = document.getElementById('file-list');
    fileUl.innerHTML = ''; // Clear previous files

    for (let i = 0; i < fileList.length; i++) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span onclick="deleteFile(${i})">&times;</span>
            ${fileList[i].name}
        `;
        fileUl.appendChild(listItem);
    }
}

function deleteFile(index) {
    const fileUl = document.getElementById('file-list');
    fileUl.removeChild(fileUl.childNodes[index]);

    const inputElement = document.getElementById('myfile');
    const currentFiles = Array.from(inputElement.files);
    currentFiles.splice(index, 1);

    // Create a new FileList and assign it to the input element
    const newFileList = new DataTransfer();
    currentFiles.forEach(file => newFileList.items.add(file));
    inputElement.files = newFileList.files;
}

function cancelForm() {
    // Implement the cancel logic as needed
}