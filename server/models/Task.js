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
        type: Date,
        default: Date.now()
    }
});

const Task = mongoose.model('Tasks', taskSchema);
module.exports = Task;