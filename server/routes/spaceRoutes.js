// Space routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const spaceController = require('../controllers/spaceController');

router.get('/space', isLoggedIn, spaceController.SpaceDashboard);
router.post('/createSpace', isLoggedIn, spaceController.createSpace);
router.delete('/space/delete/:id', isLoggedIn, spaceController.deleteSpace);
router.put('/space/:id/recover', isLoggedIn, spaceController.recoverSpace);
router.get('/subject/recover', isLoggedIn, spaceController.ShowRecover);

// Add a member to space
router.post('/space/addMember', async (req, res) => {
    const { searchQuery, role } = req.body;

    // Validate the input
    if (!searchQuery || !role) {
        return res.status(400).json({ message: 'Search query and role are required.' });
    }

    try {
        // Logic to find the user by searchQuery and add them as a member
        const user = await User.findOne({ $or: [{ email: searchQuery }, { username: searchQuery }, { userid: searchQuery }] });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Logic to add the user to the space with the specified role
        const space = await Space.findById(req.params.spaceId); // Ensure you have the correct space context
        space.members.push({ user: user._id, role }); // Adjust based on your schema
        await space.save();

        return res.status(200).json({ message: 'Member added successfully.' });
    } catch (error) {
        console.error('Error adding member:', error);
        return res.status(500).json({ message: 'An error occurred while adding the member.' });
    }
});

// Update a member's role in the space
router.put('/updateRole', spaceController.updateMemberRole);

// Remove a member from the space
router.delete('/removeMember', spaceController.removeMember);

module.exports = router;