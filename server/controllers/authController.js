// auth controller
const passport = require("passport");
const User = require("../models/User");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail } = require("../../emailService");
const { v4: uuidv4 } = require('uuid');

// Google Callback
exports.googleCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id }) || await User.findOne({ googleEmail: profile.emails?.[0]?.value });

    if (user) {
      user.lastActive = Date.now();
      user.isOnline = true;

      if (!user.googleId) user.googleId = profile.id;
      if (!user.profileImage) user.profileImage = profile.photos?.[0]?.value || '/img/profileImage/Profile.jpeg';

      await user.save();
      return done(null, user); 
    } else {
      return done(null, false, { message: 'redirect_to_google_register', googleEmail: profile.emails?.[0]?.value });
    }
  } catch (error) {
    console.error('Error in Google Callback:', error);
    return done(error, null);
  }
};

exports.googleRegisterPage = (req, res) => {
  const { googleEmail } = req.query;
  res.render('log/googleRegister', { googleEmail });
};

// Register user via Google
exports.googleRegister = async (req, res) => {
  const { firstName, lastName, googleEmail } = req.body;

  console.log("Request Body:", req.body); // Check the form data
  console.log("User from Session:", req.user); // Check the authenticated user

  try {
    // Ensure the Google session exists
    if (!req.user || !req.user.googleId) {
      req.flash("errors", ["Google authentication required to register."]);
      return res.redirect("/auth/google");
    }

    // Check for duplicate Google accounts
    const existingUser = await User.findOne({ googleId: req.user.googleId });
    if (existingUser) {
      req.flash("errors", ["Account already exists. Please log in."]);
      return res.redirect("/login");
    }

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      googleEmail,
      googleId: req.user.googleId,
      profileImage: req.user.profileImage,
      role: "user",
      lastActive: Date.now(),
      isOnline: true,
      userid: uuidv4(), // Generates a unique ID
    });
    console.log("New User Object:", newUser);
    await newUser.save();

    req.logIn(newUser, (err) => {
      if (err) {
        console.error("Login error:", err);
        req.flash("errors", ["An error occurred. Please try again."]);
        return res.redirect("/googleRegister");
      }
      res.redirect("/space");
    });
  } catch (err) {
    console.error("Error during Google Register:", err);
    req.flash("errors", ["An error occurred. Please try again."]);
    res.redirect("/googleRegister");
  }
};


exports.loginPage = (req, res) => {
  res.render("log/login");
};

exports.login = async (req, res, next) => {
  // Input validation
  if (!req.body.googleEmail || !req.body.password) {
    req.flash('error', 'Please enter email and password');
    return res.redirect('/login');
  }

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }

    if (!user) {
      req.flash('error', info.message || 'Invalid email or password');
      return res.redirect('/login');
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      try {
        user.lastLogin = Date.now();
        user.lastActive = Date.now();
        user.isOnline = true; 
        await user.save();

        if (user.role === 'admin') {
          return res.redirect('/adminPage');
        } else {
          return res.redirect('/space');
        }
      } catch (error) {
        console.error('Error updating lastActive:', error);
        return next(error);
      }
    });
  })(req, res, next);
};

// Register section
exports.registerUser = async (req, res) => {
  const { firstName, lastName, password, confirmPassword, googleEmail } = req.body;
  const errors = [];

  if (password !== confirmPassword) errors.push("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
  if (await User.findOne({ googleEmail })) errors.push("อีเมลนี้มีอยู่แล้ว");

  if (errors.length > 0) {
    req.flash("errors", errors);
    req.flash("firstName", firstName);
    req.flash("lastName", lastName);
    req.flash("googleEmail", googleEmail);
    req.flash("password", password);
    req.flash("confirmPassword", confirmPassword);
    return res.redirect("/register");
  }

  try {
    const newUser = new User({
      firstName,
      lastName,
      googleEmail
    });

    await User.register(newUser, password);
    req.flash('success', 'ลงทะเบียนสำเร็จแล้ว');
    res.redirect('/space');
  } catch (err) {
    req.flash('errors', [err.message]);
    res.redirect('/register');
  }
};
exports.registerPage = (req, res) => {
  res.render("log/register", {
    errors: req.flash("errors"),
    firstName: req.flash("firstName"),
    lastName: req.flash("lastName"),
    googleEmail: req.flash("googleEmail"),
    password: req.flash("password"),
    confirmPassword: req.flash("confirmPassword"),
  });
};

exports.loginFailure = (req, res) => {
  res.send("Something went wrong...");
};

exports.logout = (req, res) => {
  const userId = req.user ? req.user._id : null;

  req.logout(async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error logging out");
    }
    try {
      if (userId) { // Ensure userId is not null
        await User.findByIdAndUpdate(userId, { isOnline: false });
      }
      req.session.destroy((error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Error logging out");
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error('Error updating isOnline status:', error);
      res.status(500).send("Internal Server Error");
    }
  });
};


// Reset password
exports.showForgotPassword = (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  res.render('./forgot_password/forgot-password', { error, success });
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    console.log('เริ่มกระบวนการส่ง OTP');

    const user = await User.findOne({ googleEmail: email });
    if (!user) {
      req.flash('error', 'ไม่พบอีเมลในระบบ');
      console.log('ไม่พบอีเมลในระบบ:', email);
      return res.redirect('/forgot-password');
    }

    console.log('พบผู้ใช้:', user.googleEmail);

    const otp = crypto.randomBytes(6).toString('hex'); 
    const salt = await bcrypt.genSalt(12);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 300000; // OTP valid for 5 minutes
    await user.save();

    console.log('OTP ถูกบันทึกในฐานข้อมูล');

    const mailSent = await sendEmail(
      user.googleEmail,
      'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
      `รหัส OTP ของคุณคือ ${otp}. รหัส OTP จะหมดอายุใน 5 นาที.`
    );

    if (!mailSent) {
      req.flash('error', 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่');
      console.log('ส่งอีเมล OTP ไม่สำเร็จ'); // Log เมื่อส่ง OTP ล้มเหลว
      return res.redirect('/forgot-password');
    }

    console.log(`ส่งรหัส OTP ไปยังอีเมล: ${user.googleEmail}`);

    if (!mailSent) {
      req.flash('error', 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่');
      console.log('ส่งอีเมลไม่สำเร็จ');
      return res.redirect('/forgot-password');
    }

    console.log('ผลการส่งอีเมล:', mailSent); // ตรวจสอบผลลัพธ์ที่ได้จากการส่งอีเมล

    req.session.email = email;
    console.log('Session email:', req.session.email);

    req.flash('success', 'ส่งรหัส OTP ไปยังอีเมลของคุณเรียบร้อยแล้ว');
    res.redirect('/verify-otp');
  } catch (err) {
    console.error('เกิดข้อผิดพลาด:', err);
    req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
    res.redirect('/forgot-password');
  }
};

exports.showVerifyOTP = (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const { username } = req.session;
  res.render('./forgot_password/verify-otp', { error, success, username, email: req.session.email });
};

exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const { email } = req.session;

  try {
    const user = await User.findOne({ googleEmail: email });

    if (!user || !user.otp) {
      req.flash('error', 'รหัส OTP ไม่ถูกต้อง');
      return res.redirect('/verify-otp');
    }

    if (user.otpExpires < Date.now()) {
      req.flash('error', 'รหัส OTP หมดอายุ');
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.redirect('/verify-otp');
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      req.flash('error', 'รหัส OTP ไม่ถูกต้อง');
      return res.redirect('/verify-otp');
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    req.flash('success', 'รหัส OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่');
    res.redirect('/reset-password');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
    res.redirect('/verify-otp');
  }
};

exports.showResetPassword = (req, res) => {
  const { email } = req.session; // ดึงค่า email จาก session
  res.render('forgot_password/reset-password', { email }); // ส่ง email ไปที่ EJS
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const email = (req.session.email || "").trim().toLowerCase();

  try {
    const user = await User.findOne({ googleEmail: email });
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    await user.setPassword(newPassword);
    await user.save();

    req.session.email = null;
    req.flash("success", "Password reset successful. Please log in.");
    res.redirect("/login");
  } catch (err) {
    console.error("Error during password reset:", err);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/reset-password");
  }
};