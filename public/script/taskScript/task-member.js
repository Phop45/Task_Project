document.addEventListener('DOMContentLoaded', () => {
    const addMemberBtn = document.getElementById('addMemberBtn');
    const roleSelect = document.getElementById('roleSelect');
    const searchInput = document.getElementById('searchInput');

    // Add event listener for adding members
    addMemberBtn.addEventListener('click', addMember);

    // Add event listeners for updating roles
    const roleSelects = document.querySelectorAll('.roleSelect');
    roleSelects.forEach(select => {
        select.addEventListener('change', (event) => {
            const memberId = event.target.dataset.memberId;
            const newRole = event.target.value;
            updateMemberRole(memberId, newRole);
        });
    });

    // Add event listeners for removing members
    const removeMemberBtns = document.querySelectorAll('.removeMemberBtn');
    removeMemberBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            const memberId = event.target.dataset.memberId;
            removeMember(memberId);
        });
    });

    // Populate user select dropdown
    populateUserSelect();
});

async function addMember() {
    const userId = document.getElementById('userSelect').value; // Select user from dropdown
    const role = document.getElementById('roleSelect').value;

    if (!userId) {
        alert('Please select a user to add.');
        return;
    }

    try {
        const response = await fetch(`/space/addMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role })
        });

        if (response.ok) {
            location.reload();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to add member.');
        }
    } catch (error) {
        console.error('Error adding member:', error);
        alert('An error occurred while adding the member. Please try again.');
    }
}

async function updateMemberRole(memberId, newRole) {
    try {
        const response = await fetch(`/space/updateRole`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, newRole })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Failed to update role.');
        }
    } catch (error) {
        console.error('Error updating member role:', error);
        alert('An error occurred while updating the member role. Please try again.');
    }
}

async function removeMember(memberId) {
    try {
        const response = await fetch(`/space/removeMember`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId })
        });

        if (response.ok) {
            location.reload();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to remove member.');
        }
    } catch (error) {
        console.error('Error removing member:', error);
        alert('An error occurred while removing the member. Please try again.');
    }
}

async function populateUserSelect() {
    try {
        const response = await fetch('/users');
        if (response.ok) {
            const users = await response.json();
            const userSelect = document.getElementById('userSelect');
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id; // Assuming each user has a unique _id
                option.textContent = `${user.username} (${user.email})`; // Display username and email
                userSelect.appendChild(option);
            });
        } else {
            console.error('Failed to fetch users.');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}
