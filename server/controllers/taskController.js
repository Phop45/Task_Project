/// task controller
const Task = require("../models/Task");
const Spaces = require('../models/Space');
const SubTask = require('../models/SubTask');
const User = require("../models/User");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
moment.locale('th');

const extractTaskParameters = async (tasks) => {
  const taskNames = tasks.map(task => task.taskName);
  const taskDetail = tasks.map(task => task.detail);
  const taskStatuses = tasks.map(task => task.taskStatuses); 
  const taskTypes = tasks.map(task => task.taskType);
  const taskPriority = tasks.map(task => task.taskPriority);
  const taskTag = tasks.map(task => task.taskTag);

  const dueDate = tasks.map(task => {
    const date = new Date(task.dueDate);
    const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });

  const dueTime = tasks.map(task => task.dueTime); // Extract dueTime from the task

  const createdAt = tasks.map(task => {
    const date = new Date(task.createdAt);
    const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
    return date.toLocaleDateString(undefined, options);
  });

  return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, dueTime, createdAt, taskPriority, taskTag };
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
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      user: req.user.id,
      space: req.body.spaceId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null, // Handle due date
      dueTime: req.body.dueTime || null // Set due time to null if not provided
    });

    await newTask.save();

    console.log(newTask); // Log the newly created task
    res.redirect(`/space/item/${req.body.spaceId}/task_list`);
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
    const { dueDate, taskName, detail, spaceId, assignedUsers } = req.body;
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,
      detail: detail,
      user: req.user.id,
      space: spaceId,
      assignedUsers: Array.isArray(assignedUsers) ? assignedUsers : [assignedUsers] // Ensure it's an array
    });

    await newTask.save();

    res.redirect(`/space/item/${spaceId}/task_board`);
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).send("Internal Server Error");
  }
};
/// หน้าแดชบอร์ดสรุปงาน
exports.task_dashboard = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user.id;

    const space = await Spaces.findOne({
      _id: spaceId,
      $or: [{ user: userId }, { collaborators: { $elemMatch: { user: userId } } }],
    })
      .populate('collaborators.user', 'displayName profileImage')
      .lean();

    if (!space) return res.status(404).send('Space not found');

    const spaces = await Spaces.find({
      $or: [
        { user: userId },
        { collaborators: { $elemMatch: { user: userId } } }
      ],
      deleted: false // Ensure only non-deleted spaces are retrieved
    })
      .populate('user', 'username profileImage')
      .populate('collaborators.user', 'username profileImage')
      .lean();

    const tasks = await Task.find({ space: spaceId })
      .populate('assignedUsers', 'displayName profileImage')
      .populate('user', 'displayName profileImage')
      .lean();

    const usersSet = new Map();
    tasks.forEach((task) => {
      if (task.user && !usersSet.has(task.user._id.toString())) {
        usersSet.set(task.user._id.toString(), task.user);
      }
      task.assignedUsers.forEach((user) => {
        if (!usersSet.has(user._id.toString())) {
          usersSet.set(user._id.toString(), user);
        }
      });
    });

    const users = Array.from(usersSet.values());
    const subtasksCount = tasks.reduce((count, task) => count + (task.subtasks ? task.subtasks.length : 0), 0);
    const completedTasksCount = tasks.filter((t) => t.taskStatuses === 'เสร็จสิ้น').length;

    const statusCounts = {
      working: tasks.filter((t) => t.taskStatuses === 'กำลังทำ').length,
      complete: completedTasksCount,
      fix: tasks.filter((t) => t.taskStatuses === 'แก้ไข').length,
    };

    // Calculate user workload
    const userWorkload = {};
    tasks.forEach((task) => {
      task.assignedUsers.forEach((user) => {
        if (!userWorkload[user._id]) {
          userWorkload[user._id] = { name: user.displayName, workload: 0, totalTasks: 0 };
        }
        userWorkload[user._id].workload += task.taskStatuses !== 'เสร็จสิ้น' ? 1 : 0; // Only count incomplete tasks
        userWorkload[user._id].totalTasks += 1; // Total tasks assigned to the user
      });
    });

    // Calculate percent incomplete
    Object.values(userWorkload).forEach((user) => {
      user.percentIncomplete = (user.workload / user.totalTasks) * 100 || 0; // Calculate percentage
    });

    const colors = Object.keys(userWorkload).map(
      () => `#${Math.floor(Math.random() * 16777215).toString(16)}`
    );

    const workloadChartData = {
      labels: Object.values(userWorkload).map((u) => u.name),
      datasets: [
        {
          label: 'Workload per User',
          data: Object.values(userWorkload).map((u) => u.workload),
          backgroundColor: colors,
          borderColor: '#000000',
          borderWidth: 1,
        },
      ],
    };

    const currentUserRole =
      space.collaborators.find((c) => c.user.toString() === req.user._id.toString())?.role || 'Member';

      res.render('task/task-dashboard', {
        spaces: space,
        tasks,
        users,
        statusCounts, // Pass status counts for the chart
        completedTasksCount,
        subtasksCount,
        userWorkload, 
        workloadChartData: JSON.stringify(workloadChartData),
        currentUserRole,
        layout: '../views/layouts/task',
        currentPage: 'dashboard',
        user: req.user,
    });
    
  } catch (error) {
    console.error('Error in task_dashboard:', error);
    res.status(500).send('Internal Server Error');
  }
};




exports.task_board = async (req, res) => {
  try {
      const spaceId = req.params.id;
      const userId = req.user.id;
      const users = await User.find();

      // Fetch the space
      const space = await Spaces.findOne({
          _id: spaceId,
          $or: [
              { user: userId },
              { collaborators: { $elemMatch: { user: userId } } },
          ],
      })
          .populate('collaborators.user', 'username profileImage role')
          .lean();

      if (!space) {
          return res.status(404).send("Space not found");
      }

      const spaceCollaborators = (space.collaborators || []).filter(c => c && c.user);
      const currentUserRole = spaceCollaborators.find(c => c.user._id.toString() === userId)?.role || 'Member';

      const tasks = await Task.find({ space: spaceId })
          .populate('assignedUsers', 'profileImage displayName')
          .lean();

      // Count tasks by status
      const taskCounts = {};
      tasks.forEach(task => {
          const status = task.taskStatuses; // Adjust the property name if necessary
          if (!taskCounts[status]) {
              taskCounts[status] = 0;
          }
          taskCounts[status]++;
      });

      // Fetch and calculate subtask details for each task
      for (const task of tasks) {
          const subtasks = await SubTask.find({ task: task._id }).populate('assignee', 'username profileImage').lean();

          // Group subtasks by assignee and calculate completion percentage
          const assigneeProgress = subtasks.reduce((acc, subtask) => {
              const assigneeId = subtask.assignee?._id.toString();

              if (!acc[assigneeId]) {
                  acc[assigneeId] = {
                      assignee: subtask.assignee,
                      total: 0,
                      completed: 0,
                  };
              }

              acc[assigneeId].total++;
              if (subtask.subTask_status === 'เสร็จสิ้น') acc[assigneeId].completed++;

              return acc;
          }, {});

          // Add the calculated data to the task object
          task.assigneeProgress = Object.values(assigneeProgress).map((progress) => ({
              ...progress,
              percentage: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0,
          }));
      }

      // Calculate user workload
      const userWorkload = {};
      tasks.forEach(task => {
          task.assignedUsers.forEach(user => {
              const userId = user._id.toString();
              if (!userWorkload[userId]) {
                  userWorkload[userId] = {
                      name: user.displayName,
                      totalTasks: 0,
                      completedTasks: 0,
                  };
              }
              userWorkload[userId].totalTasks += 1; // Increment total tasks
              if (task.taskStatuses === 'เสร็จสิ้น') {
                  userWorkload[userId].completedTasks += 1; // Increment completed tasks
              }
          });
      });

      // Calculate completion percentages
      for (const userId in userWorkload) {
          const workload = userWorkload[userId];
          workload.percentage = workload.totalTasks > 0 ? Math.round((workload.completedTasks / workload.totalTasks) * 100) : 0;
      }

      res.render("task/task-board", {
          spaces: space,
          tasks: tasks,
          user: req.user,
          users: users,
          userName: req.user.username,
          userImage: req.user.profileImage,
          currentPage: 'board',
          layout: "../views/layouts/task",
          spaceCollaborators, // Pass the filtered list to the view
          currentUserRole, // Pass the current user's role
          taskCounts, // Pass the task counts to the view
          userWorkload: JSON.stringify(userWorkload), // Pass the user workload data
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

    const currentUserRole = space.collaborators.find(collab => collab.user.toString() === req.user._id.toString())?.role || 'Member';

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
      currentUserRole
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getSubtaskCount = async (req, res) => {
  try {
    let taskIds = req.body.taskIds;
    taskIds = taskIds.split(',').filter(id => id); // Ensure valid IDs

    // Count the subtasks related to the tasks
    const subtaskCount = await SubTask.countDocuments({ task: { $in: taskIds } });

    res.status(200).json({ subtaskCount });
  } catch (error) {
    console.error('Error fetching subtask count:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteTasks = async (req, res) => {
  try {
    let taskIds = req.body.taskIds;
    taskIds = taskIds.split(',').filter(id => id); // Ensure valid IDs

    const spaceId = req.params.id;
    const space = await Spaces.findOne({ _id: spaceId, user: req.user.id });

    if (!space) {
      return res.status(404).send('Space not found or unauthorized');
    }

    // Count the number of subtasks associated with the tasks
    const subtaskCount = await SubTask.countDocuments({ task: { $in: taskIds } });

    // Delete all subtasks related to the tasks
    await SubTask.deleteMany({ task: { $in: taskIds } });

    // Delete the main tasks
    await Task.deleteMany({ _id: { $in: taskIds }, space: spaceId });

    res.status(200).json({ 
      message: 'Tasks and subtasks deleted successfully', 
      subtaskCount 
    });
  } catch (error) {
    console.error('Error deleting tasks:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.ItemDetail = async (req, res) => {
  try {
    const taskId = ObjectId(req.params.id);  
    const spaceId = ObjectId(req.query.spaceId);  

    const task = await Task.findById(taskId)
      .populate('assignedUsers', 'profileImage username')
      .lean();

    const spaces = await Spaces.findById(spaceId).lean();
    const subtasks = await SubTask.find({ task: taskId })
      .populate('assignee', 'profileImage username')
      .sort({ createdAt: -1 })
      .lean();
    const inProgressSubtasks = await SubTask.find({ task: taskId, subTask_status: 'กำลังทำ' })
      .sort({ createdAt: -1 })
      .lean();

    const { taskNames, dueDate, dueTime, taskStatuses, taskDetail, taskPriority, taskTag } =
      await extractTaskParameters([task]);

    const thaiCreatedAt = task.createdAt.toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric',
    });

    const formattedSubtasks = subtasks.map(subtask => ({
      ...subtask,
      subTask_dueDate: subtask.subTask_dueDate
        ? subtask.subTask_dueDate.toLocaleDateString('th-TH', {
            month: 'long',
            day: 'numeric',
          })
        : 'N/A',
    }));

    const assignedUsers = task.assignedUsers || [];

    res.render("task/task-ItemDetail", {
      user: req.user, 
      currentUserId: req.user._id.toString(), 
      task,
      attachments: task.attachments || [], 
      subtasks: formattedSubtasks,
      inProgressSubtasks,
      tasks: [task],
      taskNames,
      dueDate,
      dueTime: dueTime[0],
      taskDetail,
      taskStatuses,
      createdAt: thaiCreatedAt,
      taskPriority,
      taskTag,
      spaces,
      spaceId,
      assignedUsers,
      userName: req.user.username,
      userImage: req.user.profileImage,
      layout: '../views/layouts/Detail',
      mainTaskDueDate: new Date(dueDate),
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateTask = async (req, res) => {
  try {
      const { taskId, taskName, taskStatuses, taskPriority, taskDetail } = req.body;
      const task = await Task.findById(taskId);

      if (!task) {
          return res.status(404).json({ message: 'Task not found' });
      }

      let activityLogs = [];

      // Handle task name update
      if (taskName && taskName !== task.taskName) {
          activityLogs.push({
              text: `ชื่อของงานถูกเปลี่ยนเป็น ${taskName} เมื่อ ${new Date().toLocaleString()}`,
              type: 'normal' // You can change this based on your logging needs
          });
          task.taskName = taskName;
      }

      // Handle task detail update
      if (taskDetail && taskDetail !== task.detail) {
          activityLogs.push({
              text: `รายละเอียดของงานถูกอัพเดตเมื่อ ${new Date().toLocaleString()}`,
              type: 'normal'
          });
          task.detail = taskDetail;
      }

      // Handle task status update
      if (taskStatuses) {
          activityLogs.push({
              text: `สถานะของงานถูกเปลี่ยนเป็น ${taskStatuses} เมื่อ ${new Date().toLocaleString()}`,
              type: 'normal'
          });
          task.taskStatuses = taskStatuses; // Update status based on input
      }

      // Handle task priority update
      if (taskPriority && taskPriority !== task.taskPriority) {
          activityLogs.push({
              text: `ความสำคัญของงานถูกเปลี่ยนเป็น ${taskPriority} เมื่อ ${new Date().toLocaleString()}`,
              type: 'normal'
          });
          task.taskPriority = taskPriority;
      }

      // Concatenate new logs to existing activity logs
      task.activityLogs = task.activityLogs.concat(activityLogs);
      await task.save();

      res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ message: 'Internal Server Error' });
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

const formatDateTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
exports.updateDueDate = async (req, res) => {
  const { taskId, dueDate } = req.body; // Removed logMessage from params

  try {
      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
          return res.status(404).json({ message: 'Task not found' });
      }

      // Update the task's due date
      task.dueDate = dueDate;

      // Push a new activity log for the due date update
      task.activityLogs.push({
          text: `กำหนดวันเสร็จถูกเปลี่ยนเป็น ${dueDate} เมื่อ ${new Date().toLocaleString()}`,
          type: 'normal' // or 'comment' as needed
      });

      // Save the updated task
      await task.save();

      // Respond with success
      res.status(200).json({ message: 'Due date updated successfully', task }); // Include the updated task
  } catch (error) {
      console.error('Error updating due date:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller method for updating the due time
exports.updateDueTime = async (req, res) => {
  const { taskId, dueTime } = req.body;

  try {
    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Update the task's due time
    task.dueTime = dueTime || null; // Store null if "All day" is selected

    // Push a new activity log for the due time update
    task.activityLogs.push({
      text: `เวลาที่กำหนดถูกเปลี่ยนเป็น ${dueTime ? dueTime : 'ทั้งวัน'} เมื่อ ${new Date().toLocaleString()}`,
      type: 'normal' // or 'comment' based on your requirements
    });

    // Save the updated task
    await task.save();

    res.json({ success: true, message: 'Due time updated successfully', task }); // Include the updated task
  } catch (error) {
    console.error('Error updating due time:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.updateTaskPriority = async (req, res) => {
  console.log('Incoming request body:', req.body); // Log request body

  const { taskId, taskPriority } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('Task not found:', taskId); // Log if task is not found
      return res.status(404).json({ message: 'Task not found' });
    }

    task.taskPriority = taskPriority;
    task.activityLogs.push({
      text: `ความสำคัญของงานถูกเปลี่ยนเป็น ${taskPriority} เมื่อ ${new Date().toLocaleString()}`,
      type: 'normal',
    });

    await task.save();
    console.log('Task priority updated successfully'); // Log success

    res.status(200).json({ success: true, message: 'Task priority updated successfully' });
  } catch (error) {
    console.error('Error in updateTaskPriority:', error); // Log error
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



exports.task_member = async (req, res) => {
  try {
    const space = await Spaces.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id }, // Space owner
        { collaborators: { $elemMatch: { user: req.user._id } } } // Collaborators
      ]
    })
    .populate('user', 'username profileImage') // Populate space owner
    .populate('collaborators.user', 'username profileImage email') // Populate collaborators
    .lean();

    if (!space) {
      return res.status(404).send("Space not found");
    }

    const currentUserRole = space.collaborators.find(
      collab => collab.user._id.toString() === req.user._id.toString()
    )?.role || 'Member';

    const validCollaborators = space.collaborators.filter(collab => collab && collab.user);

    // Extract collaborator and owner IDs to exclude from the allUsers list
    const collaboratorIds = validCollaborators.map(collab => collab.user._id.toString());
    collaboratorIds.push(space.user._id.toString()); // Include space owner

    // Get all users except those already in the space
    const allUsers = await User.find(
      { _id: { $nin: collaboratorIds } }, // Exclude existing collaborators and owner
      'username profileImage'
    ).lean();

    // Render the page with the filtered users
    res.render("task/task-member", {
      spaces: space,
      spaceId: req.params.id,
      collaborators: validCollaborators,
      owner: space.user,
      allUsers, // Filtered users who are not in the space
      user: req.user,
      userImage: req.user.profileImage,
      userName: req.user.username,
      currentPage: 'task_member',
      currentUserRole,
      layout: "../views/layouts/task",
    });

  } catch (error) {
    console.error('Error loading task member page:', error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateRole = async (req, res) => {
  const { memberId } = req.params;
  const { role, spaceId } = req.body; // Extract role and spaceId from the request body

  try {
      // Find the space and ensure the user is authorized to change the role
      const space = await Spaces.findOne({
          _id: spaceId,
          collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } }
      });

      if (!space) {
          return res.status(403).json({ success: false, message: 'Unauthorized to change role.' });
      }

      // Update the member's role
      await Spaces.updateOne(
          { _id: spaceId, 'collaborators.user': memberId },
          { $set: { 'collaborators.$.role': role } } // Use positional operator to update the specific collaborator
      );

      res.json({ success: true, message: 'Role updated successfully.' });
  } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.deleteMember = async (req, res) => {
  const { memberId } = req.params;
  const { spaceId } = req.body;

  try {
      // Find the space and verify the role of the current user
      const space = await Spaces.findOne({
          _id: spaceId,
          $or: [
              { user: req.user._id }, // Owner
              { collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } } } // Leader
          ]
      });

      if (!space) {
          return res.status(403).json({ success: false, message: 'You do not have permission to remove members.' });
      }

      // Check if the current user is trying to remove themselves
      if (req.user._id.toString() === memberId) {
          return res.status(400).json({ success: false, message: 'You cannot remove yourself.' });
      }

      // Ensure the current user has the "Leader" role
      const isLeader = space.collaborators.some(collab =>
          collab.user._id.toString() === req.user._id.toString() && collab.role === 'Leader'
      );

      if (!isLeader) {
          return res.status(403).json({ success: false, message: 'Only a leader can remove members.' });
      }

      // Remove the member from the space
      await Spaces.updateOne(
          { _id: spaceId },
          { $pull: { collaborators: { user: memberId } } }
      );

      res.json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.pendingTask = async (req, res) => {
  try {
    const space = await Spaces.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } } }]
    }).lean();

    if (!space) {
      return res.status(404).send("Space not found");
    }

    const tasks = await Task.find({
      space: req.params.id,
      taskStatuses: 'รอตรวจ' // Filter tasks with 'Pending' status
    })
      .populate({
        path: 'assignedUsers',
        select: 'displayName profileImage'
      })
      .lean();

    // Get the user's role from the collaborators array
    const currentUserRole = space.collaborators.find(collab => collab.user.toString() === req.user._id.toString())?.role || 'Member';
    res.render("task/pending-task", {
      tasks, 
      spaces: space,
      spaceId: req.params.id,
      user: req.user,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'pending-task',
      layout: "../views/layouts/task",
      currentUserRole,
    });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).send("Internal Server Error");
  }
};


exports.pendingDetail = async (req, res) => {
  try {
    const taskId = ObjectId(req.params.id);  
    const spaceId = ObjectId(req.query.spaceId);  

    const task = await Task.findById(taskId)
      .populate('assignedUsers', 'profileImage username')
      .lean();

    const spaces = await Spaces.findById(spaceId).lean();
    const subtasks = await SubTask.find({ task: taskId })
      .populate('assignee', 'profileImage username')
      .sort({ createdAt: -1 })
      .lean();
    const inProgressSubtasks = await SubTask.find({ task: taskId, subTask_status: 'กำลังทำ' })
      .sort({ createdAt: -1 })
      .lean();

    const { taskNames, dueDate, dueTime, taskStatuses, taskDetail, taskPriority, taskTag } =
      await extractTaskParameters([task]);

    const thaiCreatedAt = task.createdAt.toLocaleDateString('th-TH', {
      month: 'long',
      day: 'numeric',
    });

    const formattedSubtasks = subtasks.map(subtask => ({
      ...subtask,
      subTask_dueDate: subtask.subTask_dueDate
        ? subtask.subTask_dueDate.toLocaleDateString('th-TH', {
            month: 'long',
            day: 'numeric',
          })
        : 'N/A',
    }));

    const assignedUsers = task.assignedUsers || [];

    res.render("task/detail-pending-task", {
      user: req.user, 
      currentUserId: req.user._id.toString(), 
      task,
      attachments: task.attachments || [], 
      subtasks: formattedSubtasks,
      inProgressSubtasks,
      tasks: [task],
      taskNames,
      dueDate,
      dueTime: dueTime[0],
      taskDetail,
      taskStatuses,
      createdAt: thaiCreatedAt,
      taskPriority,
      taskTag,
      spaces,
      spaceId,
      assignedUsers,
      userName: req.user.username,
      userImage: req.user.profileImage,
      layout: '../views/layouts/Detail',
      mainTaskDueDate: new Date(dueDate),
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).send("Internal Server Error");
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const taskId = req.params.id;
    const spaceId = req.query.spaceId;
    const uploadedFiles = req.files;

    // Store original filename and path (with Thai characters)
    const attachments = uploadedFiles.map(file => ({
      path: `/docUploads/${file.filename}`, // Use relative path for serving files
      originalName: file.originalname // Preserve original name with Thai characters
    }));

    // Update the task with new attachments
    await Task.findByIdAndUpdate(
      taskId,
      { $push: { attachments: { $each: attachments } } },
      { new: true, runValidators: true }
    );

    res.redirect(`/task/${taskId}/detail?spaceId=${spaceId}`);
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Controller function to delete a file
exports.deleteFile = async (req, res) => {
  try {
      const fileId = req.params.id;

      // Find the task that contains the file attachment by its ID
      const task = await Task.findOne({ 'attachments._id': fileId });

      if (!task) {
          return res.status(404).json({ error: 'File not found' });
      }

      // Find the specific file in the attachments array and remove it
      const file = task.attachments.id(fileId);
      const filePath = file.path; // Get the path to the file

      file.remove(); // Remove the file from the task's attachments
      await task.save(); // Save the updated task

      // Optionally delete the file from the filesystem
      fs.unlink(path.join(__dirname, '..', filePath), (err) => {
          if (err) {
              console.error('Error deleting file from filesystem:', err);
          }
      });

      // Send a success response
      res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addComment = async (req, res) => {
    try {
        const { comment } = req.body; // Get the comment from the request
        const taskId = req.params.id; // Assume taskId is passed in the URL

        // Push the comment as an object to the activityLogs
        await Task.findByIdAndUpdate(taskId, {
            $push: {
                activityLogs: { text: comment, type: 'comment' }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateTaskDescription = async (req, res) => {
  const { taskId, taskDetail } = req.body; // Ensure 'taskDetail' matches field in frontend

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Update the task description
    task.detail = taskDetail;  // Use 'detail' to align with schema field

    // Add to activity logs
    task.activityLogs.push({
      text: `คำอธิบายของงานถูกอัปเดตเมื่อ ${new Date().toLocaleString()}`,
      type: 'normal',
    });

    await task.save();  // Save the updated task

    res.status(200).json({ success: true, message: 'Task description updated successfully' });
  } catch (error) {
    console.error('Error updating task description:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
