// Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
    path: String, 
    originalName: String,
    uploadedAt: { type: Date, default: Date.now },
});

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
        default: null
    },
    startDate: { 
        type: Date,
        default: null
    },
    dueTime: {
        type: String,
        validate: {
            validator: function (v) {
                return v === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time! Expected format is HH:mm.`
        }
    },
    taskTag: [{
        type: String
    }],
    detail: {
        type: String,
        default: "",   
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
    taskStatus: {
        type: String,
        required: true,
    },      
    taskPriority: {
        type: String,
        enum: ['urgent', 'normal', 'low'],
        default: 'normal'
    },
    activityLogs: [{
        text: { type: String },
        type: { type: String, enum: ['normal', 'comment'], default: 'normal' }
    }],
    attachments: [attachmentSchema],
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });


const Task = mongoose.model('Tasks', taskSchema);
module.exports = Task;