// User Model
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    userid: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [8, "รหัสผ่านต้องมีอักขระอย่างน้อย 8 ตัว"],
    },
    googleId: {
      type: String,
      required: false,
    },
    googleEmail: {
      type: String,
      required: false,
      unique: true,
    },
    profileImage: {
      type: String,
      default: '/img/profileImage/Profile.jpeg',
    },
    otp: {
      type: String,
      required: false,
    },
    otpExpires: {
      type: Date,
      required: false,
    },
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
});

module.exports = mongoose.model('User', UserSchema);
