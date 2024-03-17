/// task controller
const Task = require("../models/Task");
const Subject = require("../models/Subject");
const Subtask = require("../models/Subtask");
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;

const extractTaskParameters = async (tasks) => {
  const taskNames = tasks.map(task => task.taskName);
  const taskDetail = tasks.map(task => task.detail);
  const taskStatuses = tasks.map(task => task.status);
  const taskTypes = tasks.map(task => task.taskType);
  const taskPriority = tasks.map(task => task.taskPriority);
  const dueDate = tasks.map(task => {
    const date = new Date(task.dueDate);
    const options = { day: 'numeric', month: 'long', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });
  const createdAt = tasks.map(task => {
    const date = new Date(task.createdAt);
    const options = { day: 'numeric', month: 'long', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });

  return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt, taskPriority };
};

/// Add Task
exports.addTask = async (req, res) => {
  try {
    const dueDateTime = req.body.dueDateTime;

    const task = new Task({
      taskName: req.body.taskName,
      dueDate: new Date(dueDateTime),
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      taskType: req.body.taskType,
      user: req.user.id,
      subject: req.body.subjectId
    });
    await task.save();
    res.redirect(`/subject/item/${req.body.subjectId}`);
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
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.addSubtask = async function(req, res) {
  const { subtask_Name } = req.body;
  try {
      const subtask = new Subtask({ subtask_Name });
      await subtask.save();

      res.status(200).json({ message: 'Subtask added successfully', subtask });
      console.log('Subtask added successfully');
  } catch (error) {
      // Send an error response
      res.status(500).json({ message: 'An error occurred', error });
  }
};

/// Task Dashboard
exports.task_dashbard = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const tasks = await Task.find({ subject: req.params.id }).lean();

    const { taskNames, dueDate, taskStatuses, taskTypes} = await extractTaskParameters(tasks);
    const thaiDueDate = dueDate.map(date => new Date(date).toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    }));

    res.render("task/task-dashboard", {
      subjects: subject,
      tasks: tasks,
      taskNames: taskNames,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
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
    const thaiDueDate = dueDate.map(date => new Date(date).toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    }));

    const taskId = req.query.taskId;
    let taskDetails = {};
    if (taskId) {
      const task = await Task.findById(taskId).lean();
      if (task) {
        taskDetails = {
          taskName: task.taskName,
        };
      }
    }

    res.render("task/task-list", {
      subjects: subject,
      tasks: tasks,
      taskNames: taskNames,
      taskDetail: taskDetail,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
      createdAt: createdAt,
      subjectId: req.params.id,
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,
      user: req.user.id,
      layout: "../views/layouts/task",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'task_list',
      taskDetails: taskDetails
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

/// Get Task Details
exports.getTaskDetails = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.ItemDetail = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    const { taskNames, dueDate, taskStatuses, taskTypes, taskDetail, taskPriority } = await extractTaskParameters([task]);
    const thaiDueDate = dueDate.map(date => new Date(date).toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    }));
    const thaiCreatedAt = task.createdAt.toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    });

    res.render("task/task-ItemDetail", {
      task: task,
      taskNames: taskNames,
      dueDate: thaiDueDate,
      taskDetail: taskDetail,
      taskTypes: taskTypes,
      taskStatuses: taskStatuses,
      createdAt: thaiCreatedAt,
      taskPriority: taskPriority,
      subject: subject,
      subjectId: req.params.id,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      layout: "../views/layouts/task",
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).send("Internal Server Error");
  }
};