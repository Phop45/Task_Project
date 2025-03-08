// User Model
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },

  googleId: { type: String, unique: true, sparse: true },
  googleEmail: { type: String, unique: true, required: true },

  profileImage: {
    type: String,
    default: '/img/profileImage/Profile.jpeg',
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
  otp: {
    type: String,
    required: false,
  },
  otpExpires: {
    type: Date,
    required: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      inWeb: { type: Boolean, default: true },
    },
  },
  resetToken: {
    type: String,
    required: false,
  },
  resetTokenExpiration: {
    type: Date,
    required: false,
  },
  userid: { type: String, unique: true, sparse: true },
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'googleEmail' // Use googleEmail as the username field
});

module.exports = mongoose.model('User', UserSchema);
