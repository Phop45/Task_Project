/// task controller
const Task = require("../models/Task");
const Subject = require("../models/Subject");
const Subtask = require("../models/Subtask");
const Notes = require("../models/Notes");
const moment = require('moment');
const multer = require('multer');
const path = require('path');
moment.locale('th');

const extractTaskParameters = async (tasks) => {
  const taskNames = tasks.map(task => task.taskName);
  const taskDetail = tasks.map(task => task.detail);
  const taskStatuses = tasks.map(task => task.status);
  const taskTypes = tasks.map(task => task.taskType);
  const taskPriority = tasks.map(task => task.taskPriority);
  const taskTag = tasks.map(task => task.taskTag);
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

  return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt, taskPriority, taskTag };
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

/// popup เพิ่มงาน จากหน้า lits
exports.addTask2 = async (req, res) => {
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
    res.redirect(`/subject/item/${req.body.subjectId}/task_list`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
/// หน้าแดชบอร์ดสรุปงาน
exports.task_dashboard = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const tasks = await Task.find({ subject: req.params.id }).lean();

    const { taskNames, dueDate, taskStatuses, taskTypes } = await extractTaskParameters(tasks);
    const thaiDueDate = dueDate.map(date => moment(date).format('LL'));
    subject.createdAt = moment(subject.createdAt).format('LL');

    // Calculate status counts
    const statusCounts = {
      working: tasks.filter(task => task.status === 'กำลังทำ').length,
      compleate: tasks.filter(task => task.status === 'เสร็จสิ้น').length,
      fix: tasks.filter(task => task.status === 'แก้ไข').length,
    };

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
      currentPage: 'dashboard',
      statusCounts: statusCounts
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.task_board = async (req, res) => {
  try {
      const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
      const tasks = await Task.find({ subject: req.params.id }).lean();

      res.render("task/task-board", {
          subjects: subject,
          tasks: tasks, // Pass tasks to the EJS view
          user: req.user.id,
          userName: req.user.firstName,
          userImage: req.user.profileImage,
          currentPage: 'task_board',
          layout: "../views/layouts/task",
      });
  } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
  }
};

/// หน้าแสดงงานเป็นลิสต์
exports.task_list = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.id }).lean();
    console.log('Subjects:', subject);

    const tasks = await Task.find({ subject: req.params.id }).lean();
    const { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt } = await extractTaskParameters(tasks);
    const thaiDueDate = dueDate.map(date => moment(date).format('DD MMMM'));
    const thaicreatedAt = createdAt.map(date => moment(date).format('DD MMMM'));

    const taskId = req.query.taskId;
    if (taskId) {
      const task = await Task.findById(taskId).lean();
    }

    res.render("task/task-list", {
      subjects: subject,
      subjectId: req.params.id,
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,

      tasks: tasks,
      taskNames: taskNames,
      taskDetail: taskDetail,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
      createdAt: thaicreatedAt,

      user: req.user.id,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'task_list',
      layout: "../views/layouts/task",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



/// ลบงาน
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

exports.ItemDetail = async (req, res) => {
  try {
    const subject = await Subject.findById({ _id: req.params.id, user: req.user.id }).lean();
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    const { taskNames, dueDate, taskStatuses, taskTypes, taskDetail, taskPriority, taskTag } = await extractTaskParameters([task]);
    const thaiDueDate = dueDate.map(date => new Date(date).toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    }));
    const thaiCreatedAt = task.createdAt.toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric'
    });

    // Debug
    console.log('Tasks:', task);
    console.log('Subjects:', subject);

    res.render("task/task-ItemDetail", {
      task: task,
      taskNames: taskNames,
      dueDate: thaiDueDate,
      taskDetail: taskDetail,
      taskTypes: taskTypes,
      taskStatuses: taskStatuses,
      createdAt: thaiCreatedAt,
      taskPriority: taskPriority,
      taskTag: taskTag,

      subjects: subject,
      SubName: req.body.SubName,
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

exports.updateTask = async (req, res) => {
  try {
    const { taskId, taskName, taskType, taskStatuses, taskPriority, taskDetail } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        taskType,
        status: taskStatuses,
        taskPriority,
        taskName,
        detail: taskDetail
      },
      { new: true }
    );

    res.redirect(`/task/${updatedTask._id}/detail`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


/// Note
exports.addNotes = async (req, res) => {
  const { title, content, noteId, subjectId } = req.body;

  try {
    if (noteId) {
      // Update existing note
      await Notes.findOneAndUpdate(
        { _id: noteId, user: req.user.id },
        { title, content },
        { new: true }
      );
    } else {
      // Create new note
      const newNote = new Notes({
        title,
        content,
        user: req.user.id,
        subject: subjectId
      });
      await newNote.save();
    }

    res.redirect(`/subject/item/${subjectId}/task_notes`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.task_notes = async (req, res) => {
  const { id } = req.params;
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.id }).lean();
    const notes = await Notes.find({ subject: req.params.id, user: req.user.id }).lean();

    res.render("task/task-notes", {
      subjects: subject,
      notes: notes,
      user: req.user.id,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'notes',
      layout: "../views/layouts/task",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Update note controller
exports.updateNote = async (req, res) => {
  const { noteId, title, content } = req.body;

  try {
    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (content) updatedFields.content = content;

    const updatedNote = await Notes.findByIdAndUpdate(noteId, updatedFields, { new: true });

    if (!updatedNote) {
      return res.status(404).send({ message: 'Note not found' });
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Hard delete note controller
exports.deleteNote = async (req, res) => {
  const { noteId } = req.body;

  try {
    const deletedNote = await Notes.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).send({ message: 'Note not found' });
    }

    res.status(200).send({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
      const { taskId, newStatus } = req.body;
      const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { status: newStatus },
          { new: true }
      );

      if (!updatedTask) {
          return res.status(404).send({ message: 'Task not found' });
      }

      res.status(200).send({ message: 'Task updated successfully' });
  } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).send('Internal Server Error');
  }
};