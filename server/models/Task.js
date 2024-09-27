// Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    space: {
        type: Schema.ObjectId,
        ref: 'Space'
    },
    taskName: {
        type: String,
    },
    dueDate: {
        type: Date,
    },
    dueTime: {
        type: String
    },
    taskTag: [{
        type: String
    }],
    detail: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deleteAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['กำลังทำ', 'เสร็จสิ้น', 'แก้ไข'],
        default: 'กำลังทำ'
    },
    taskPriority: {
        type: String,
        enum: ['ด่วน', 'ปกติ', 'ต่ำ'],
        default: 'ปกติ'
    },
    activityLogs: {
        type: [String],
        default: []
    },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Task = mongoose.model('Tasks', taskSchema);
module.exports = Task;