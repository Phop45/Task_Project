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
    date: {
        type: Date
    },
    taskTag: {
        type: String
    },
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
        enum: ['ยังไม่ทำ', 'กำลังทำ', 'เสร็จสิ้น'],
        default: 'ยังไม่ทำ'
    },
    taskType: {
        type: String,
        enum: ['งานทั่วไป','การบ้าน', 'งานกลุ่ม', 'งานแลป', 'สอบ'],
        default: 'งานทั่วไป'
    }
},
{ timestamps: { createdAt: 'createdAt', updatedAt: 'deleteAt' }});

const Task = mongoose.model('Tasks', taskSchema);
module.exports = Task;


