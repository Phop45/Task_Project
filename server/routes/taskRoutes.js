// TaskRoute.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isLoggedIn } = require('../middleware/checkAuth');
const upload = require('../middleware/upload'); 

router.post('/addTask', isLoggedIn, taskController.addTask);
router.post('/addTask2', isLoggedIn, taskController.addTask2);
router.post('/addTask_board', isLoggedIn, taskController.addTask_board);
router.post('/addTask_list', isLoggedIn, taskController.addTask_list);
router.post('/addNotes', isLoggedIn, taskController.addNotes);
router.get('/space/item/:id', isLoggedIn, taskController.task_dashboard);
router.get('/space/item/:id/task_list', isLoggedIn, taskController.task_list);
router.get('/space/item/:id/task_notes', isLoggedIn, taskController.task_notes);
router.get('/space/item/:id/task_board', isLoggedIn, taskController.task_board);
router.post('/space/item/:id/deleteTasks', isLoggedIn, taskController.deleteTasks);
router.post('/deleteActivityLog', isLoggedIn, taskController.deleteActivityLog);
router.get('/task/:id/detail', isLoggedIn, taskController.ItemDetail);
router.get('/task/:id/pendingDetail', isLoggedIn, taskController.pendingDetail);

router.post('/updateTask', isLoggedIn, taskController.updateTask);
router.post('/updateNote', isLoggedIn, taskController.updateNote);
router.post('/deleteNote', isLoggedIn, taskController.deleteNote);
router.post('/updateTaskStatus', isLoggedIn, taskController.updateTaskStatus);
router.post('/updateDueDate', isLoggedIn, taskController.updateDueDate);
router.post('/updateDueTime', isLoggedIn, taskController.updateDueTime);
router.get('/space/item/:id/member', isLoggedIn, taskController.task_member);
router.get('/space/item/:id/pedding', isLoggedIn, taskController.pendingTask);

router.post('/uploadDocument/:id', upload.array('documents', 5),isLoggedIn, taskController.uploadDocument);

module.exports = router;