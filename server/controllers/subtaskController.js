const Task = require("../models/Task");
const SubTask = require("../models/Subtask");

exports.createSubTask = async (req, res) => {
    try {
        const { subTask, taskId } = req.body;

        if (!subTask || !taskId) {
            return res.status(400).send({ message: 'Subtask name and task ID are required' });
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send({ message: 'Task not found' });
        }

        const newSubTask = new SubTask({
            subtask_Name: subTask,
            task: taskId,
            user: req.user._id,  // Assuming you have user authentication
            subject: task.subject,
            taskPriority: 'ปกติ',  // Default priority, can be customized
        });

        await newSubTask.save();

        res.redirect(`/task/${taskId}/detail`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.toggleSubTaskCompletion = async (req, res) => {
    try {
      const { subtaskId } = req.body;
  
      if (!subtaskId) {
          return res.status(400).send({ message: 'Subtask ID is required' });
      }
  
      const subtask = await SubTask.findById(subtaskId);
      const task = await Task.findById(subtask.task);
  
      if (!subtask || !task) {
          return res.status(404).send({ message: 'Subtask or Task not found' });
      }
  
      const now = new Date();
      let activityLogMessage = '';
  
      // Toggle completion status and add activity logs
      if (subtask.completed) {
          subtask.completed = false;
          activityLogMessage = `Subtask "${subtask.subtask_Name}" has been edited at ${formatDateTime(now)}`;
      } else {
          subtask.completed = true;
          activityLogMessage = `Subtask "${subtask.subtask_Name}" is completed at ${formatDateTime(now)}`;
      }
  
      subtask.activityLogs.push(activityLogMessage);
      await subtask.save();
  
      // Update task activity logs
      task.activityLogs.push(activityLogMessage);
      await task.save();
  
      res.status(200).send({ message: 'Subtask completion status toggled' });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  // Helper function to format date and time
  function formatDateTime(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('th-TH', options);
  }