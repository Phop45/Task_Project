//Space Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collaboratorSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { 
        type: String, 
        enum: ['Leader', 'owner', 'admin', 'Member', 'Guest'], 
        default: 'Member'
    },
    joinDate: { type: Date, default: Date.now }
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
        type: String,
        default: "/public/spaceictures/defultBackground.jpg",
      },
    deleted: {
        type: Boolean,
        default: false
    },
    collaborators: [collaboratorSchema],
}, {
    timestamps: true 
});

const Spaces = mongoose.model('Spaces', spaceSchema);
module.exports = Spaces;