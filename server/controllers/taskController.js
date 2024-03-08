// task controller
const Task = require("../models/Task");
const mongoose = require("mongoose");

// Add Task
exports.addTask = async (req, res) =>{
    try {
      const newTask = new Task({
        taskName: req.body.taskName,
        date: req.body.datepicker,
        taskTag: req.body.taskTag,
        detail: req.body.detail,
        user: req.user.id,
        subject: req.body.subjectId
      });
      await newTask.save();
      res.redirect(`/subject/item/${req.body.subjectId}`);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
};

// View
exports.viewTask = async (req, res) => {
   const task = await Task.findById({ _id: req.params.id }).where({ user: req.user.id }).lean();
   if (task) {
     res.render("task/task-dashboard", {
        taskID: req.params.id,
        taskName: req.body.taskName,
        task,
        layout: "../views/layouts/task",
        userName: req.user.firstName,
        userImage: req.user.profileImage
      });
      res.redirect(`/subject/item/${req.body.subjectId}`);
    } else {
      res.send("Something went wrong.");
    }
};

