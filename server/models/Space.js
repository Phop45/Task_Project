//Space Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ,
    role: { 
        type: String, 
        enum: ['Leader', 'Member'], 
        required: true 
    }
});

const spaceSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    SpaceName: {
        type: String,
        required: true
    },
    SpaceDescription: {
        type: String
    },
    SpacePicture: {
        type: String
    },
    deleted: {
        type: Boolean,
        default: false
    },
    collaborators: [memberSchema],
}, {
    timestamps: true 
});

const Spaces = mongoose.model('Spaces', spaceSchema);
module.exports = Spaces;