const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const friendController = require('../controllers/friendController');

router.get('/friend', isLoggedIn, friendController.allFriend);

module.exports = router;