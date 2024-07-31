const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  googleId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);