// User Model
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    userid: {
      type: String,
      unique: true,
      // Sample data for userid: #1234
    },
    username: {
      type: String,
      required: true,
      unique: true,
      // Sample data for username: JohnDoe
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [8, "รหัสผ่านต้องมีอักขระอย่างน้อย 8 ตัว"],
      // Sample data for password: 12345678
    },
    googleId: {
      type: String,
      required: false,
      // Sample data for googleId: 1234567890
    },
    googleEmail: {
      type: String,
      required: false,
      unique: true,
      // Sample data for googleEmail: ppn543@gmail.com
    },
    profileImage: {
      type: String,
      default: '/img/profileImage/Profile.jpeg',
      // sample data for profileImage: /img/profileImage/Profile.jpeg
    },
    otp: {
      type: String,
      required: false,
      // Sample data for otp: 123456
    },
    otpExpires: {
      type: Date,
      required: false,
    },
    lineUserId: { // Add LINE user ID field
      type: String,
      required: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
});

module.exports = mongoose.model('User', UserSchema);
