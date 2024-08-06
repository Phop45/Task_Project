// sub task routes
const express = require('express');
const router = express.Router();
const subTaskController = require('../controllers/subtaskController');
const { isLoggedIn } = require('../middleware/checkAuth');

router.post('/addSubtask', isLoggedIn, subTaskController.createSubTask);
router.post('/toggleSubTaskCompletion', isLoggedIn, subTaskController.toggleSubTaskCompletion);

module.exports = router;