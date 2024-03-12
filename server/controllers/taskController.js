/// task controller
const Task = require("../models/Task");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

const extractTaskParameters = async (tasks) => {
  const taskNames = tasks.map(task => task.taskName);
  const taskDetail = tasks.map(task => task.detail);
  const taskStatuses = tasks.map(task => task.status);
  const taskTypes = tasks.map(task => task.taskType);
  const dueDate = tasks.map(task => {
    const date = new Date(task.date);
    const options = { day: 'numeric', month: 'long', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });
  const createdAt = tasks.map(task => {
    const date = new Date(task.createdAt);
    const options = { day: 'numeric', month: 'long', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });

  return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt };
};

/// Add Task
exports.addTask = async (req, res) => {
  try {
    const newTask = new Task({
      taskName: req.body.taskName,
      date: new Date().toLocaleDateString('th-TH'),
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      taskType: req.body.taskType, // Add taskType from select
      user: req.user.id,
      subject: req.body.subjectId
    });
    await newTask.save();
    res.redirect(`/subject/item/${req.body.subjectId}`);
    console.log(newTask);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.addTask_list = async (req, res) => {
  try {
    const newTask = new Task({
      taskName: req.body.taskName,
      date: new Date().toLocaleDateString('th-TH'),
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      user: req.user.id,
      subject: req.body.subjectId
    });
    await newTask.save();
    res.redirect(`/subject/item/${req.body.subjectId}/task_list`);
    console.log(newTask);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// Task Dashboard
exports.task_dashbard = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const tasks = await Task.find({ subject: req.params.id }).lean();

    const { taskNames, dueDate, taskStatuses, taskTypes} = await extractTaskParameters(tasks);

    res.render("task/task-dashboard", {
      subjects: subject,
      tasks: tasks,
      taskNames: taskNames,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: dueDate,
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,
      user: req.user.id,
      layout: "../views/layouts/task",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// Task List
exports.task_list = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const tasks = await Task.find({ subject: req.params.id }).lean();

    const { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt } = await extractTaskParameters(tasks);

    res.render("task/task-list", {
      subjects: subject,
      tasks: tasks,
      taskNames: taskNames,
      taskDetail: taskDetail,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: dueDate,
      createdAt: createdAt,
      subjectId: req.params.id,
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,
      user: req.user.id,
      layout: "../views/layouts/task",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'task_list'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// Delete Task
exports.deleteTasks = async (req, res) => {
  try {
    let taskIds = req.body.taskIds;
    taskIds = taskIds.split(',').filter(id => id);

    const subjectId = req.params.id;
    const subject = await Subject.findOne({ _id: subjectId, user: req.user.id });

    await Task.deleteMany({ _id: { $in: taskIds }, subject: subjectId });

    // Redirect back to the task list page for the subject
    res.redirect(`/subject/item/${subjectId}/task_list`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// Update Task
exports.updateTaskStatus = async (req, res) => {
  try {
    await Task.updateOne({ _id: req.params.id }, { status: req.body.status });
    res.redirect(`/subject/item/${req.body.subjectId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
