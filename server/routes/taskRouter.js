const express = require('express');
const { Router } = require('express');  // เพิ่มบรรทัดนี้

const router = Router();

const taskController = require('../controllers/taskController');
const multer = require('multer');
const upload = multer();

router.get('/task', taskController.renderTaskPage);
router.get('/addTask', taskController.renderAddTaskPage);
router.post('/createTask', taskController.createTask_post);

router.get('/task', (req, res) => {
    res.render('task', { userName: req.user.firstName, layout: null });
  });

module.exports = router;