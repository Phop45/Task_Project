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
        type: String,
        required: true
    },
    SubPicture: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;