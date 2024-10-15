const Task = require("../models/Task");
const SubTask = require("../models/SubTask");

exports.createSubTask = async (req, res) => {
    const { taskId, subTask, dueDate } = req.body;

    console.log("Received data:", { taskId, subTask, dueDate }); // Log incoming data

    try {
        // Validate incoming data
        if (!taskId || !subTask || !dueDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create a new subtask instance
        const newSubTask = new SubTask({
            task: taskId,
            subtask_Name: subTask,
            subTask_dueDate: dueDate ? new Date(dueDate) : null // Ensure proper date format
        });

        // Save to the database
        await newSubTask.save();

        // Respond with success
        res.status(200).json({ message: 'Subtask created successfully' });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({ message: 'Error creating subtask' });
    }
};

exports.deleteSubtask = async (req, res) => {
    try {
        const subtaskId = req.params.id;
        await SubTask.findByIdAndDelete(subtaskId);
        res.status(200).json({ message: 'Subtask deleted successfully.' });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ message: 'Failed to delete subtask.' });
    }
};

// Toggle subtask status
exports.toggleSubTaskStatus = async (req, res) => {
    const { subtaskId } = req.body;

    if (!subtaskId) {
        return res.status(400).json({ message: 'Subtask ID is required' });
    }

    try {
        const subtask = await SubTask.findById(subtaskId);

        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        subtask.subTask_status = subtask.subTask_status === 'กำลังทำ' ? 'เสร็จสิ้น' : 'กำลังทำ';
        await subtask.save();

        res.status(200).json({
            message: 'Status updated successfully',
            status: subtask.subTask_status,
        });
    } catch (error) {
        console.error('Error toggling status:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
};


exports.getSubtaskDetails = async (req, res) => {
    try {
        const subtask = await SubTask.findById(req.params.id);

        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        res.status(200).json(subtask);
    } catch (error) {
        console.error('Error fetching subtask details:', error);
        res.status(500).json({ message: 'Failed to fetch subtask details' });
    }
};

exports.updateSubtask = async (req, res) => {
    try {
        const { subtaskId, SubtaskName, subtaskDescription } = req.body;
        const newStatus = req.body.subtaskStatus; // Get the new status

        // Update the subtask in the database
        const updatedSubtask = await SubTask.findByIdAndUpdate(
            subtaskId,
            {
                subtask_Name: SubtaskName, // Update the name if needed
                description: subtaskDescription, // Update description
                subTask_status: newStatus // Update status
            },
            { new: true } // Return the updated subtask
        );

        if (!updatedSubtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        // Respond with success
        res.status(200).json({ message: 'Subtask updated successfully', subtask: updatedSubtask });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

