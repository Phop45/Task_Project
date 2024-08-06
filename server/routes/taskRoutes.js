// TaskRoute.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isLoggedIn } = require('../middleware/checkAuth');

router.post('/addTask', isLoggedIn,taskController.addTask);
router.post('/addTask2', isLoggedIn,taskController.addTask2);
router.post('/addTask_list', isLoggedIn,taskController.addTask_list);

router.post('/addNotes', isLoggedIn, taskController.addNotes);

router.get('/subject/item/:id', isLoggedIn, taskController.task_dashboard);
router.get('/subject/item/:id/task_list', isLoggedIn, taskController.task_list);
router.get('/subject/item/:id/task_notes', isLoggedIn, taskController.task_notes);
router.get('/subject/item/:id/task_board', isLoggedIn, taskController.task_board);

router.post('/subject/item/:id/deleteTasks', isLoggedIn, taskController.deleteTasks);
router.post('/deleteActivityLog', isLoggedIn, taskController.deleteActivityLog);
router.get('/task/:id/detail', isLoggedIn, taskController.ItemDetail);
router.post('/updateTask', isLoggedIn, taskController.updateTask);
router.post('/updateNote', isLoggedIn, taskController.updateNote);
router.post('/deleteNote', isLoggedIn, taskController.deleteNote);
router.post('/updateTaskStatus', isLoggedIn, taskController.updateTaskStatus);


module.exports = router;