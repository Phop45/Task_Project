const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
    SubName: {
        type: String,
        required: true
    },
    SubDescription: {
        type: String
    },
    SubjectCode:{
        type: String
    },
    Professor:{
        type: String
    },
    SubPicture: {
        type: String
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
    collaborators: [{
        type: Schema.ObjectId,
        ref: 'User'
    }]
});

const Subject = mongoose.model('Subjects', subjectSchema);
module.exports = Subject;
