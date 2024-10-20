// auth controller
const passport = require("passport");
const User = require("../models/User");
const crypto = require('crypto'); // Add this line for crypto functionality
const bcrypt = require('bcrypt');
const { sendEmail } = require("../../emailService");

// ฟังก์ชันสำหรับสุ่ม userid
function generateUserId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let userid = "";
  for (let i = 0; i < 6; i++) {
    userid += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return userid;
}

// ฟังก์ชันสำหรับสุ่ม username
function generateUsername() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `user_${randomNum}`;
}

exports.googleCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    } else {
      user = await User.findOne({ googleEmail: profile.emails[0].value });

      if (user && !user.googleId) {
        user.googleId = profile.id;
        user.profileImage = profile.photos[0]?.value || '/img/profileImage/Profile.jpeg';
        await user.save();
        return done(null, user);
      } else {
        let username = generateUsername();
        let userid = generateUserId();

        while (await User.findOne({ username })) {
          username = generateUsername();
        }
        while (await User.findOne({ userid })) {
          userid = generateUserId();
        }

        const newUser = new User({
          googleId: profile.id,
          googleEmail: profile.emails[0].value,
          username: username,
          userid: userid,
          profileImage: profile.photos[0]?.value || '/img/profileImage/Profile.jpeg',
        });

        user = await newUser.save();
        return done(null, user);
      }
    }
  } catch (error) {
    console.error(error);
    return done(error, null);
  }
};

exports.loginPage = (req, res) => {
  res.render("log/login");
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      console.log("User not found or incorrect credentials.");
      req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); // Flash error message for incorrect credentials
      return res.redirect("/login");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      return res.redirect("/space");
    });
  })(req, res, next);
};

exports.registerUser = async (req, res) => {
  const { username, password, confirmPassword, googleEmail } = req.body;
  let errors = [];

  if (password !== confirmPassword) {
    errors.push("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
  }

  const existingUsername = await User.findOne({ username });
  const existingEmail = await User.findOne({ googleEmail });

  if (existingUsername) errors.push("ชื่อผู้ใช้นี้มีอยู่แล้ว");
  if (existingEmail) errors.push("อีเมลนี้มีอยู่แล้ว");

  if (errors.length > 0) {
    req.flash("errors", errors);
    req.flash("username", username);
    req.flash("googleEmail", googleEmail);
    return res.redirect("/register");
  }

  try {
    const newUser = new User({
      username,
      googleEmail,
      password,
      profileImage: '/img/profileImage/Profile.jpeg', // Set default profile image here
    });

    if (password) {
      User.register(newUser, password, (err, user) => {
        if (err) {
          req.flash("errors", [err.message]);
          return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, () => res.redirect("/space"));
      });
    } else {
      const savedUser = await newUser.save();
      req.logIn(savedUser, (err) => {
        if (err) return next(err);
        res.redirect("/space");
      });
    }
  } catch (err) {
    req.flash("errors", [err.message]);
    res.redirect("/register");
  }
};

exports.registerPage = (req, res) => {
  res.render("log/register", {
    errors: req.flash("errors"),
    username: req.flash("username"),
    googleEmail: req.flash("googleEmail"),
    password: req.flash("password"),
    confirmPassword: req.flash("confirmPassword"),
  });
};

exports.loginFailure = (req, res) => {
  res.send("Something went wrong...");
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error logging out");
    }
    req.session.destroy((error) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Error logging out");
      }
      res.redirect("/");
    });
  });
};

//resetpassword
exports.showForgotPassword = (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  res.render('./forgot_password/forgot-password', { error, success });
};

exports.resendOTP = async (req, res) => {
  const { username } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username: username });
    if (!user) {
      req.flash('error', 'ชื่อผู้ใช้ไม่ถูกต้อง');
      return res.redirect('/forgot-password');
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(12);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Save OTP and expiration time
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 300000; // OTP valid for 5 minutes
    await user.save();

    // Send OTP via email
    await sendEmail(user.googleEmail, 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน', `รหัส OTP ของคุณคือ ${otp}. รหัส OTP จะหมดอายุใน 5 นาที.`);

    req.session.username = username; // Save username in session for further processes
    req.flash('success', 'ส่งรหัส OTP ไปยังอีเมลของคุณเรียบร้อยแล้ว');
    res.redirect('/verify-otp');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
    return res.redirect('/forgot-password');
  }
};

exports.showVerifyOTP = (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const { username } = req.session;
  res.render('./forgot_password/verify-otp', { error, success, username });
};

exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const { username } = req.session;

  try {
    const user = await User.findOne({ username: username });

    if (!user || !user.otp || user.otpExpires < Date.now()) {
      req.flash('error', 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
      return res.redirect('/verify-otp');
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      req.flash('error', 'รหัส OTP ไม่ถูกต้อง');
      return res.redirect('/verify-otp');
    }

    // Clear OTP after verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    req.flash('success', 'รหัส OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่');
    return res.redirect('/reset-password');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
    return res.redirect('/verify-otp');
  }
};

exports.showResetPassword = (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  res.render('./forgot_password/reset-password', { error, success });
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { username } = req.session;

  try {
    // ค้นหาผู้ใช้จาก username
    const user = await User.findOne({ username: username });

    if (!user) {
      req.flash('error', 'ไม่พบผู้ใช้ที่ร้องขอการรีเซ็ตรหัสผ่าน');
      console.log(`ไม่พบผู้ใช้ที่ร้องขอการรีเซ็ตรหัสผ่าน: ${username}`);
      return res.redirect('/forgot-password');
    }

    // ใช้ setPassword ของ passport-local-mongoose เพื่ออัปเดตรหัสผ่านใหม่
    await user.setPassword(newPassword);

    // ล้างข้อมูล OTP หลังจากรีเซ็ตรหัสผ่านสำเร็จ
    user.otp = undefined;
    user.otpExpires = undefined;

    // บันทึกข้อมูลผู้ใช้หลังจากอัปเดต
    await user.save();

    // log เมื่ออัปเดตรหัสผ่านสำเร็จ
    console.log(`รหัสผ่านของผู้ใช้ ${username} ถูกอัปเดตเรียบร้อยแล้ว`);

    // ส่งข้อความไปยังผู้ใช้
    req.flash('success', 'รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบใหม่');
    res.redirect('/login');
  } catch (err) {
    // log ข้อผิดพลาดหากมีปัญหาในการรีเซ็ตรหัสผ่าน
    console.error(`เกิดข้อผิดพลาดในการอัปเดตรหัสผ่านของ ${username}:`, err);
    req.flash('error', 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองอีกครั้ง');
    res.redirect('/reset-password');
  }
};
