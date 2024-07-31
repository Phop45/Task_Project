const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const friendRequestController = require('../controllers/friendRequestController');

router.post('/sendFriendRequest', isLoggedIn, friendRequestController.sendFriendRequest);
router.post('/acceptFriendRequest/:id', isLoggedIn, friendRequestController.acceptFriendRequest);
router.get('/notifications', isLoggedIn, friendRequestController.viewNotifications);

module.exports = router;