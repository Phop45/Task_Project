// Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subTaskSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
    subject: {
        type: Schema.ObjectId,
        ref: 'Subject'
      },
    task: {
        type: Schema.ObjectId,
        ref: 'Task'
      },
    subtask_Name: {
        type: String,
    },
    subTask_dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    taskPriority: {
        type: String,
        enum: ['เร่งด่วน', 'ปกติ'],
        default: 'ปกติ'
    }
},
{ timestamps: { createdAt: 'createdAt' }});

const subTask = mongoose.model('subTask', subTaskSchema);
module.exports = subTask;


