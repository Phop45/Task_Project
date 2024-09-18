/// task controller
const Task = require("../models/Task");
const Subject = require("../models/Subject");
const SubTask = require('../models/SubTask');
const User = require("../models/User");
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
      const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
      return date.toLocaleDateString(undefined, options);
  });
  const createdAt = tasks.map(task => {
      const date = new Date(task.createdAt);
      const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
      return date.toLocaleDateString(undefined, options);
  });

  return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt, taskPriority, taskTag };
};

/// Add Task
exports.addTask = async (req, res) => {
  try {
    const assignedUsers = req.body.assignedUsers || [];
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined; // Define dueDate

    const newTask = new Task({
      taskName: req.body.taskName,
      dueDate: dueDate, // Use the defined dueDate
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      taskType: req.body.taskType,
      user: req.user.id,
      subject: req.body.subjectId,
      assignedUsers: assignedUsers
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

/// popup เพิ่มงาน จากหน้า list
exports.addTask2 = async (req, res) => {
  try {
    const { dueDate, taskName, taskTag, detail, taskType, subjectId } = req.body;
    const assignedUsers = req.body.assignedUsers || [];
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,  
      taskTag: taskTag,
      detail: detail,
      taskType: taskType,
      user: req.user.id,
      subject: subjectId,
      assignedUsers: assignedUsers
    });

    // Save the task to the database
    await newTask.save();

    // Redirect to the task list page of the subject
    res.redirect(`/subject/item/${subjectId}/task_list`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


/// หน้าแดชบอร์ดสรุปงาน
exports.task_dashboard = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.id;

    // Fetch the subject
    const subject = await Subject.findOne({
      _id: subjectId,
      $or: [
        { user: userId },
        { collaborators: userId }
      ]
    })
    .populate('collaborators', 'displayName profileImage')
    .lean();

    if (!subject) {
      return res.status(404).send('Subject not found');
    }

    // Fetch the tasks with populated user details
    const tasks = await Task.find({ subject: subjectId })
      .populate({
        path: 'assignedUsers',
        select: 'displayName profileImage'
      })
      .populate({
        path: 'user', // Populate the task owner
        select: 'displayName profileImage'
      })
      .lean();

    // Collect all unique users (task owners + assigned users)
    const usersSet = new Map(); // Using Map to avoid duplicates by `_id`

    tasks.forEach(task => {
      // Add task owner if not already in the map
      if (task.user) {
        if (!usersSet.has(task.user._id.toString())) {
          usersSet.set(task.user._id.toString(), task.user);
        }
      }

      // Add assigned users
      task.assignedUsers.forEach(assignedUser => {
        if (!usersSet.has(assignedUser._id.toString())) {
          usersSet.set(assignedUser._id.toString(), assignedUser);
        }
      });
    });

    const users = Array.from(usersSet.values()); // Convert map values to an array

    const subtasksCount = await SubTask.countDocuments({ subject: subjectId });
    const completedTasksCount = tasks.filter(task => task.status === 'เสร็จสิ้น').length;

    const { taskNames, dueDate, taskStatuses, taskTypes } = await extractTaskParameters(tasks);

    const thaiDueDate = dueDate.map(date => moment(date, 'MMMM DD, YYYY').format('LL'));
    subject.createdAt = moment(subject.createdAt).format('LL');

    const statusCounts = {
      working: tasks.filter(task => task.status === 'กำลังทำ').length,
      complete: tasks.filter(task => task.status === 'เสร็จสิ้น').length,
      fix: tasks.filter(task => task.status === 'แก้ไข').length,
    };

    const userWorkload = {};
    tasks.forEach(task => {
      task.assignedUsers.forEach(user => {
        if (!userWorkload[user._id]) {
          userWorkload[user._id] = { name: user.displayName, workload: 0 };
        }
        userWorkload[user._id].workload += 1;
      });
    });

    const colors = Object.keys(userWorkload).map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

    const workloadChartData = {
      labels: Object.values(userWorkload).map(user => user.name),
      datasets: [{
        label: 'Workload per User',
        data: Object.values(userWorkload).map(user => user.workload),
        backgroundColor: colors,
        borderColor: '#000000',
        borderWidth: 1
      }]
    };

    res.render("task/task-dashboard", {
      subjects: subject,
      tasks: tasks,
      taskNames: taskNames,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
      users: users,
      currentUser: req.user,
      user: userId,
      layout: "../views/layouts/task",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'dashboard',
      statusCounts: statusCounts,
      subtasksCount: subtasksCount,
      completedTasksCount: completedTasksCount,
      workloadChartData: JSON.stringify(workloadChartData),
    });
  } catch (error) {
    console.log('Error in task_dashboard:', error);
    res.status(500).send("Internal Server Error");
  }
};

exports.task_board = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.id;

    // Fetch the subject, allowing access if the user is the owner or a collaborator
    const subject = await Subject.findOne({
      _id: subjectId,
      $or: [
        { user: userId },
        { collaborators: userId }
      ]
    })
    .lean();

    if (!subject) {
      return res.status(404).send("Subject not found");
    }

    // Fetch the tasks and populate the assignedUsers field with user details
    const tasks = await Task.find({ subject: subjectId })
      .populate('assignedUsers', 'profileImage displayName')  // Populate with user profile image and display name
      .lean();
    
    // Format task creation dates if needed
    tasks.forEach(task => {
      task.createdAtFormatted = moment(task.createdAt).format('DD-MM'); // Format to 'DD-MM' if required
    });

    const users = await User.find();

    res.render("task/task-board", {
      subjects: subject,
      tasks: tasks,
      users: users,
      user: userId,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'board',
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
    const subject = await Subject.findOne({ 
      _id: req.params.id, 
      $or: [
          { user: req.user._id },
          { collaborators: req.user._id }
      ]
    })
    .populate({
        path: 'user',
        select: 'displayName profileImage'
    })
    .lean();

    const tasks = await Task.find({ subject: req.params.id })
            .populate({
                path: 'assignedUsers',
                select: 'displayName profileImage'
            })
            .lean();

    // Extract task parameters
    const { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt } = await extractTaskParameters(tasks);
    const thaiDueDate = dueDate.map(date => moment(date).format('DD MMMM'));
    const thaiCreatedAt = createdAt.map(date => moment(date).format('DD MMMM'));

    // Handle specific task details if provided
    const taskId = req.query.taskId;
    if (taskId) {
      const task = await Task.findById(taskId).lean();
      // Do something with the task if needed
    }

    res.render("task/task-list", {
      subjects: subject, // Ensure 'subject' is properly passed
      subjectId: req.params.id,
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,
      tasks: tasks,
      taskNames: taskNames,
      taskDetail: taskDetail,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
      createdAt: thaiCreatedAt,
      users: tasks.flatMap(task => task.assignedUsers), // Flatten user details from tasks
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
    const task = await Task.findById(taskId).populate('assignedUsers', 'displayName profileImage').lean(); // Populate assigned users
    const subtasks = await SubTask.find({ task: taskId }).sort({ createdAt: -1 }).exec();
    const { taskNames, dueDate, taskStatuses, taskTypes, taskDetail, taskPriority, taskTag } = await extractTaskParameters([task]);
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
      subtasks: subtasks,
      tasks: [task],
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
      subjectId: req.query.subjectId,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      layout: "../views/layouts/task",
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).send("Internal Server Error");
  }
};

const formatDateTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId, taskName, taskType, taskStatuses, taskPriority, dueDate, taskDetail } = req.body;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }

    let activityLogs = [];
    const now = new Date();

    // Handle updates to task attributes other than due date
    if (taskName && taskName !== task.taskName) {
      activityLogs.push(`ชื่อของงานถูกเปลี่ยนเป็น ${taskName} เมื่อ ${formatDateTime(now)}`);
      task.taskName = taskName;
    }

    if (taskDetail && taskDetail !== task.detail) {
      activityLogs.push(`รายละเอียดของงานถูกอัพเดตเมื่อ ${formatDateTime(now)}`);
      task.detail = taskDetail;
    }

    if (taskType && taskType !== task.taskType) {
      activityLogs.push(`ประเภทของงานเปลี่ยนเป็น ${taskType} เมื่อ ${formatDateTime(now)}`);
      task.taskType = taskType;
    }

    if (taskStatuses && taskStatuses !== task.status) {
      activityLogs.push(`สถานะของงานถูกเปลี่ยนเป็น ${taskStatuses} เมื่อ ${formatDateTime(now)}`);
      task.status = taskStatuses;
    }

    if (taskPriority && taskPriority !== task.taskPriority) {
      activityLogs.push(`ความสำคัญของงานถูกเปลี่ยนเป็น ${taskPriority} เมื่อ ${formatDateTime(now)}`);
      task.taskPriority = taskPriority;
    }

    if (dueDate && new Date(dueDate).toISOString() !== new Date(task.dueDate).toISOString()) {
      activityLogs.push(`วันครบกำหนดของงานถูกเปลี่ยนเป็น ${moment(dueDate).format('LL')} เมื่อ ${formatDateTime(now)}`);
      task.dueDate = dueDate;
    }


    task.activityLogs = task.activityLogs.concat(activityLogs);

    await task.save();

    res.redirect(`/task/${task._id}/detail`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.deleteActivityLog = async (req, res) => {
  try {
    const { taskId, logId } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }

    task.activityLogs = task.activityLogs.filter(log => log._id.toString() !== logId);

    await task.save();

    res.redirect(`/task/${taskId}/detail`);
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
    // Fetch subject details, including collaborators
    const subject = await Subject.findOne({
      _id: id,
      $or: [
        { user: req.user.id }, // Owner
        { collaborators: req.user.id } // Collaborator
      ]
    }).lean();

    // Check if subject was found
    if (!subject) {
      return res.status(403).send("Access denied"); // Or redirect to a "not authorized" page
    }

    // Fetch all notes related to the subject
    const notes = await Notes.find({ subject: id })
      .populate('user', 'profileImage displayName') // Populate user details
      .lean();

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
