const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/addTask', taskController.addTask);
router.get('/task/item/:id', taskController.viewTask);

module.exports = router;