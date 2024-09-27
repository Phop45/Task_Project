// user model
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

function generateUserId() {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let userid = "";
    for (let i = 0; i < 6; i++) {
        userid += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return userid;
}

const UserSchema = new Schema({
  userid: {
      type: String,
      unique: true,
  },
  username: {
      type: String,
      required: [true, "กรุณากรอกชื่อผู้ใช้"],
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
      default: 'image/profileImage/img-user.svg', // Set your default image path here
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


UserSchema.pre("save", async function (next) {
    if (this.isModified("password") || this.isNew) {
        if (this.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(this.password, salt);
                console.log("Hashed Password in pre-save middleware:", hash); // Log hashed password
                this.password = hash;
            } catch (err) {
                return next(err);
            }
        }
    }
    next();
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
