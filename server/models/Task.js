// Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
    subject: {
        type: Schema.ObjectId,
        ref: 'Subject'
      },
    taskName: {
        type: String,
    },
    dueDate: {
        type: Date
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
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
    deleteAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['กำลังทำ', 'เสร็จสิ้น', 'แก้ไข'],
        default: 'กำลังทำ'
    },
    taskType: {
        type: String,
        enum: ['งานทั่วไป','การบ้าน', 'งานกลุ่ม', 'งานแลป', 'สอบ'],
        default: 'งานทั่วไป'
    },
    taskPriority: {
        type: String,
        enum: ['เร่งด่วน', 'ปกติ'],
        default: 'ปกติ'
    }
},
{ timestamps: { createdAt: 'createdAt', updatedAt: 'deleteAt' }});

const Task = mongoose.model('Tasks', taskSchema);
module.exports = Task;