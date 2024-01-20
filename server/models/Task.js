// models/Task.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema({
    taskname: {
        type: String,
        required: true
    },
    taskdetail: {
        type: String,
        required: true
    },
    listaddtodo: {
        type: Array,
        items: String
    },
    filelist: {
        type: Array,
        items: String
    },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;