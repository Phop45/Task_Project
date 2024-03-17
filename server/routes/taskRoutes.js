// TaskRoute
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isLoggedIn } = require('../middleware/checkAuth');

router.post('/addTask', isLoggedIn,taskController.addTask);
router.post('/addTask_list', isLoggedIn,taskController.addTask_list);
router.post('/addSubtask', isLoggedIn,taskController.addSubtask);

router.get('/subject/item/:id', isLoggedIn, taskController.task_dashbard);
router.get('/subject/item/:id/task_list', isLoggedIn, taskController.task_list);
router.post('/subject/item/:id/deleteTasks', isLoggedIn, taskController.deleteTasks);
router.post('/task/:id/updateStatus', isLoggedIn, taskController.updateTaskStatus);
router.get('/getTaskDetails/:id', isLoggedIn, taskController.getTaskDetails);
router.get('/task/:id/detail', isLoggedIn, taskController.ItemDetail);

module.exports = router;