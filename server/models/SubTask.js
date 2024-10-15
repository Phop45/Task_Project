// sub Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subTaskSchema = new Schema({
    task: {
        type: Schema.ObjectId,
        ref: 'Task'
    },
    subtask_Name: {
        type: String,
        required: true
    },
    subTask_dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    subTask_status: {
        type: String,
        enum: ['กำลังทำ', 'เสร็จสิ้น'],
        default: 'กำลังทำ'
    },
    activityLogs: {
        type: [String],
        default: []
    }
}, { timestamps: { createdAt: 'createdAt' } });

const SubTask = mongoose.models.SubTask || mongoose.model('SubTask', subTaskSchema);

module.exports = SubTask;