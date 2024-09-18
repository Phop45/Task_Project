const Task = require("../models/Task");
const SubTask = require("../models/SubTask");

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
            user: req.user._id,
            subject: task.subject,
            taskPriority: 'ปกติ',
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

      if (subtask.completed) {
          subtask.completed = false;
          activityLogMessage = `"${subtask.subtask_Name}" ถูกแก้ไขเมื่อ ${formatDateTime(now)}`;
      } else {
          subtask.completed = true;
          activityLogMessage = `"${subtask.subtask_Name}" เสร็จสิ้นเมื่อ ${formatDateTime(now)}`;
      }
  
      subtask.activityLogs.push(activityLogMessage);
      await subtask.save();
  
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