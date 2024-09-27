const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true 
});

const Spaces = mongoose.model('Spaces', spaceSchema);
module.exports = Spaces;