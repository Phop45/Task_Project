// TaskRoute
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isLoggedIn } = require('../middleware/checkAuth');

router.post('/addTask', isLoggedIn,taskController.addTask);
router.post('/addTask2', isLoggedIn,taskController.addTask2);
router.post('/addTask_list', isLoggedIn,taskController.addTask_list);

router.get('/subject/item/:id', isLoggedIn, taskController.task_dashboard);
router.get('/subject/item/:id/task_list', isLoggedIn, taskController.task_list);
router.post('/subject/item/:id/deleteTasks', isLoggedIn, taskController.deleteTasks);
router.get('/getTaskDetails/:id', isLoggedIn, taskController.getTaskDetails);
router.get('/task/:id/detail', isLoggedIn, taskController.ItemDetail);
router.post('/updateTask', isLoggedIn, taskController.updateTask);

module.exports = router;