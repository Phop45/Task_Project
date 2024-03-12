const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const settingController = require('../controllers/settingController');

router.get('/setting', isLoggedIn, settingController.viewSetting);

module.exports = router;