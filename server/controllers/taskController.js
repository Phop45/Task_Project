/// task controller
const Task = require("../models/Task");
const Spaces = require('../models/Space');
const Subject = require("../models/Subject");
const SubTask = require('../models/SubTask');
const User = require("../models/User");
const Notes = require("../models/Notes");
const moment = require('moment');
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
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

    const newTask = new Task({
      taskName: req.body.taskName,
      dueDate: dueDate,
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      taskType: req.body.taskType,
      user: req.user.id,
      space: req.body.spaceId, // Change subjectId to spaceId
      assignedUsers: assignedUsers
    });

    await newTask.save();
    res.redirect(`/space/item/${req.body.spaceId}`); // Change URL accordingly
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
      space: req.body.spaceId 
    });
    await newTask.save();
    res.redirect(`/space/item/${req.body.spaceId}/task_list`);
    console.log(newTask);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// popup เพิ่มงาน จากหน้า list
exports.addTask2 = async (req, res) => {
  try {
    const { dueDate, taskName, taskTag, detail, taskType, spaceId } = req.body; 
    const assignedUsers = req.body.assignedUsers || [];
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,
      taskTag: taskTag,
      detail: detail,
      taskType: taskType,
      user: req.user.id,
      space: spaceId,
      assignedUsers: assignedUsers
    });

    await newTask.save();

    res.redirect(`/space/item/${spaceId}/task_list`); 
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addTask_board = async (req, res) => {
  try {
    const { dueDate, taskName, taskTag, detail, taskType, spaceId } = req.body; 
    const assignedUsers = req.body.assignedUsers || [];
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,
      taskTag: taskTag,
      detail: detail,
      taskType: taskType,
      user: req.user.id,
      space: spaceId,
      assignedUsers: assignedUsers
    });

    await newTask.save();

    res.redirect(`/space/item/${spaceId}/task_board`); 
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// หน้าแดชบอร์ดสรุปงาน
exports.task_dashboard = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user.id;

    // Fetch the space
    const space = await Spaces.findOne({
      _id: spaceId,
      $or: [
        { user: userId },
        { collaborators: userId }
      ]
    })
    .populate('collaborators', 'displayName profileImage')
    .lean();

    if (!space) {
      return res.status(404).send('Space not found');
    }

    // Fetch tasks related to the space
    const tasks = await Task.find({ space: spaceId }) // Using spaceId
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
    const usersSet = new Map();

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

    const users = Array.from(usersSet.values());

    // Count subtasks and completed tasks
    const subtasksCount = await SubTask.countDocuments({ space: spaceId }); // Change subject to space
    const completedTasksCount = tasks.filter(task => task.status === 'เสร็จสิ้น').length;

    // Extract task parameters
    const { taskNames, dueDate, taskStatuses, taskTypes } = await extractTaskParameters(tasks);

    // Format due dates for Thai locale
    const thaiDueDate = dueDate.map(date => moment(date, 'MMMM DD, YYYY').format('LL'));
    space.createdAt = moment(space.createdAt).format('LL'); // Use space instead of subject

    // Status counts
    const statusCounts = {
      working: tasks.filter(task => task.status === 'กำลังทำ').length,
      complete: tasks.filter(task => task.status === 'เสร็จสิ้น').length,
      fix: tasks.filter(task => task.status === 'แก้ไข').length,
    };

    // Calculate user workload
    const userWorkload = {};
    tasks.forEach(task => {
      task.assignedUsers.forEach(user => {
        if (!userWorkload[user._id]) {
          userWorkload[user._id] = { name: user.displayName, workload: 0 };
        }
        userWorkload[user._id].workload += 1;
      });
    });

    // Generate colors for chart
    const colors = Object.keys(userWorkload).map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

    // Workload chart data
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

    // Render the dashboard
    res.render("task/task-dashboard", {
      spaces: space, // Use space instead of subjects
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
    const spaceId = req.params.id; // Changed subjectId to spaceId
    const userId = req.user.id;

    // Fetch the space, allowing access if the user is the owner or a collaborator
    const space = await Spaces.findOne({
      _id: spaceId,
      $or: [
        { user: userId },
        { collaborators: userId }
      ]
    }).lean();

    if (!space) {
      return res.status(404).send("Space not found"); // Changed message accordingly
    }

    // Fetch the tasks and populate the assignedUsers field with user details
    const tasks = await Task.find({ space: spaceId }) // Changed subject to space
      .populate('assignedUsers', 'profileImage displayName')
      .lean();
    
    // Format task creation dates if needed
    tasks.forEach(task => {
      task.createdAtFormatted = moment(task.createdAt).format('DD-MM');
    });

    const users = await User.find();

    res.render("task/task-board", {
      spaces: space, // Changed subjects to spaces
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

// Task list page
exports.task_list = async (req, res) => {
  try {
    // Fetch the space with collaborators and owner
    const space = await Spaces.findOne({
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

    // Fetch the tasks associated with the space
    const tasks = await Task.find({ space: req.params.id })
      .populate({
        path: 'assignedUsers',
        select: 'displayName profileImage'
      })
      .lean();

    // Extract the parameters
    const { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, createdAt, taskPriority, taskTag } = await extractTaskParameters(tasks);

    // Format the dates in Thai
    const thaiDueDate = dueDate.map(date => moment(date).format('DD MMMM'));
    const thaiCreatedAt = createdAt.map(date => moment(date).format('DD MMMM'));

    // Render the task list page, passing all extracted data
    res.render("task/task-list", {
      spaces: space, 
      spaceId: req.params.id,
      tasks: tasks,
      taskNames: taskNames,
      taskDetail: taskDetail,
      taskStatuses: taskStatuses,
      taskTypes: taskTypes,
      dueDate: thaiDueDate,
      createdAt: thaiCreatedAt,
      taskPriority: taskPriority,  // New addition
      taskTag: taskTag,  // New addition
      users: tasks.flatMap(task => task.assignedUsers),
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

    const spaceId = req.params.id; 
    const space = await Spaces.findOne({ _id: spaceId, user: req.user.id });

    await Task.deleteMany({ _id: { $in: taskIds }, space: spaceId });

    res.redirect(`/space/item/${spaceId}/task_list`); 
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.ItemDetail = async (req, res) => {
  try {
    const spaces = await Spaces.findById({ _id: req.params.id, user: req.user.id }).lean(); // Changed subject to space
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate('assignedUsers', 'displayName profileImage').lean();
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
      spaces: spaces, 
      spaceId: req.query.spaceId,
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
    const { taskId, taskName, taskStatuses, taskPriority, dueDate, taskDetail } = req.body;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }

    let activityLogs = [];
    const now = new Date();

    // Handle updates to task attributes
    if (taskName && taskName !== task.taskName) {
      activityLogs.push(`ชื่อของงานถูกเปลี่ยนเป็น ${taskName} เมื่อ ${formatDateTime(now)}`);
      task.taskName = taskName;
    }

    if (taskDetail && taskDetail !== task.detail) {
      activityLogs.push(`รายละเอียดของงานถูกอัพเดตเมื่อ ${formatDateTime(now)}`);
      task.detail = taskDetail;
    }

    if (taskStatuses && taskStatuses !== task.status) {
      activityLogs.push(`สถานะของงานถูกเปลี่ยนเป็น ${taskStatuses} เมื่อ ${formatDateTime(now)}`);
      task.status = taskStatuses;
    }

    // Handle updates to the task priority
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

    res.redirect(`/task/${taskId}/detail`);
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
  const { title, content, noteId, spaceId } = req.body; // Changed subjectId to spaceId

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
        space: spaceId // Changed subject to space
      });
      await newNote.save();
    }

    res.redirect(`/space/item/${spaceId}/task_notes`); // Changed subject to space
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.task_notes = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch space details, including collaborators
    const space = await Space.findOne({
      _id: id,
      $or: [
        { user: req.user.id },
        { collaborators: req.user.id }
      ]
    }).lean();

    if (!space) {
      return res.status(403).send("Access denied");
    }

    // Fetch all notes related to the space
    const notes = await Notes.find({ space: id }) // Changed subject to space
      .populate('user', 'profileImage displayName')
      .lean();

    res.render("task/task-notes", {
      spaces: space, // Changed subjects to spaces
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

// Update task status
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
