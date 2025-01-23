/// task page controller
const Task = require("../../models/Task");
const Spaces = require('../../models/Space');
const SubTask = require('../../models/SubTask');
const User = require("../../models/User");
const Status = require('../../models/Status')
const moment = require('moment');
const mongoose = require('mongoose');
moment.locale('th');

const extractTaskParameters = async (tasks) => {
    const taskNames = tasks.map(task => task.taskName);
    const taskDetail = tasks.map(task => task.detail);
    const taskStatuses = tasks.map(task => task.taskStatuses);
    const taskTypes = tasks.map(task => task.taskType);
    const taskPriority = tasks.map(task => task.taskPriority);
    const taskTag = tasks.map(task => task.taskTag);

    const dueDate = tasks.map(task => {
        const date = moment(task.dueDate).locale('th'); // Set locale to Thai
        return {
            day: date.format('DD'),
            month: date.format('MMM'), // Use abbreviated Thai month names
            year: date.format('YYYY') // Buddhist calendar year (BE)
        };
    });

    const dueTime = tasks.map(task => task.dueTime);

    const createdAt = tasks.map(task => {
        const date = new Date(task.createdAt);
        const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
        return date.toLocaleDateString(undefined, options);
    });

    return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, dueTime, createdAt, taskPriority, taskTag };
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

// board render page controller
exports.task_board = async (req, res) => {
    try {
        const spaceId = req.params.id;
        const userId = req.user.id;

        // Fetch the space
        const space = await Spaces.findOne({
            _id: spaceId,
            $or: [{ user: userId }, { collaborators: { $elemMatch: { user: userId } } }],
        })
            .populate('collaborators.user', 'username profileImage googleEmail ')
            .lean();

        if (!space) {
            return res.status(404).send("Space not found");
        }

        const spaceCollaborators = (space.collaborators || []).filter(c => c && c.user);
        const currentUserRole = spaceCollaborators.find(c => c.user._id.toString() === userId)?.role || 'Member';

        // Fetch tasks and populate required fields
        const tasks = await Task.find({ space: spaceId })
            .populate('assignedUsers', 'profileImage displayName')
            .lean();

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

        // Organize tasks by status
        const statuses = await Status.find({ space: spaceId }).lean();
        const tasksByStatus = statuses.reduce((acc, status) => {
            acc[status.name] = tasks.filter(task => task.taskStatus === status.name);
            return acc;
        }, {});

        // Prepare task counts for each status category
        const taskCounts = statuses.reduce((acc, status) => {
            acc[status.category] = tasksByStatus[status.name]?.length || 0;
            return acc;
        }, {});

        // Sort statuses by category
        const sortedStatuses = statuses.sort((a, b) => {
            const order = ['toDo', 'inProgress', 'fix', 'finished'];
            return order.indexOf(a.category) - order.indexOf(b.category);
        });

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
                if (task.taskStatus === 'เสร็จสิ้น') {
                    userWorkload[userId].completedTasks += 1; // Increment completed tasks
                }
            });
        });

        // Calculate completion percentages for each user
        for (const userId in userWorkload) {
            const workload = userWorkload[userId];
            workload.percentage = workload.totalTasks > 0 ? Math.round((workload.completedTasks / workload.totalTasks) * 100) : 0;
        }

        res.render("task/task-board", {
            spaces: space,
            tasks,
            tasksByStatus,
            statuses: sortedStatuses,
            taskCounts,
            user: req.user,
            spaceCollaborators,
            currentUserRole,
            moment,
            userWorkload: JSON.stringify(userWorkload),
            currentPage: 'board',
            layout: "../views/layouts/task",
            priority: tasks.map(task => task.taskPriority), // Pass task priorities
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};


// ลิสต์งาน (ยังไม่ได้ใช้)
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

// Grantt Chart
exports.granttChart = async (req, res) => {
    try {
        // Fetch space details (owner or collaborator)
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

        // Fetch tasks in the space
        const tasks = await Task.find({ space: req.params.id })
            .select("taskName createdAt dueDate assignedUsers")
            .populate("assignedUsers", "username")
            .lean();

        // Format tasks for Gantt chart
        const formattedTasks = tasks.map(task => ({
            id: task._id.toString(),
            name: task.taskName,
            start: task.createdAt.toISOString(),
            end: task.dueDate.toISOString(),
            assigned: task.assignedUsers.map(user => user.username),
        }));

        // Get the current user's role in the space
        const currentUserRole = space.collaborators.find(
            collab => collab.user._id.toString() === req.user._id.toString()
        )?.role || 'Member';

        // Render the view with data
        res.render("task/granttChart", {
            spaces: space,
            tasks: formattedTasks,
            spaceId: req.params.id,
            user: req.user,
            userImage: req.user.profileImage,
            userName: req.user.username,
            currentUserRole,
            currentPage: 'granttChart',
            layout: "../views/layouts/task",
        });

    } catch (error) {
        console.error('Error rendering Gantt chart page:', error);
        res.status(500).send("Internal Server Error");
    }
};