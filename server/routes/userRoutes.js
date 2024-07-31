const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const userController = require('../controllers/userController');

router.get('/allUsers', isLoggedIn, userController.allUsers);
router.post('/addFriend/:id', isLoggedIn, userController.addFriend);
router.post('/deleteFriend/:id', isLoggedIn, userController.deleteFriend);

module.exports = router;