const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../../emailService');

module.exports.login = (req, res) => {
    const error = req.flash('error');
    const success = req.flash('success');
    res.render('./login_register/login', { error, success, csrfToken: req.csrfToken() });
};

module.exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: username });
        if (user) {
            console.log('Hashed Password in database:', user.password);
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.login(user, (err) => {
                    if (err) {
                        req.flash('error', 'เกิดข้อผิดพลาดในการล็อกอิน');
                        return res.redirect('/login');
                    }
                    return res.redirect('/dashboard');
                });
            } else {
                req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                return res.redirect('/login');
            }
        } else {
            req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            return res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
        return res.redirect('/login');
    }
};



module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
            return res.redirect('/dashboard');
        }
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
                return res.redirect('/dashboard');
            }
            res.redirect('/');
        });
    });
};

module.exports.showForgotPassword = (req, res) => {
    const error = req.flash('error');
    const success = req.flash('success');
    res.render('./forgot_password/forgot-password', { error, success, csrfToken: req.csrfToken() });
};

module.exports.resendOTP = async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            req.flash('error', 'ชื่อผู้ใช้ไม่ถูกต้อง');
            return res.redirect('/forgot-password'); // เปลี่ยนจาก /verify-otp เป็น /forgot-password
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const salt = await bcrypt.genSalt(12);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 300000; // 5 minutes expiration
        await user.save();

        req.session.username = username; // Save username in session

        await sendEmail(user.googleEmail, 'รหัส OTP ใหม่สำหรับการรีเซ็ตรหัสผ่าน', `รหัส OTP ของคุณคือ ${otp}. รหัส OTP จะหมดอายุใน 5 นาที.`);

        req.flash('success', 'ส่งรหัส OTP ใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว');
        res.redirect('/verify-otp');
    } catch (err) {
        console.error(err);
        req.flash('error', 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง');
        return res.redirect('/forgot-password');
    }
};


module.exports.showVerifyOTP = (req, res) => {
    const error = req.flash('error');
    const success = req.flash('success');
    const { username } = req.session; // Retrieve the username from session
    res.render('./forgot_password/verify-otp', { error, success, csrfToken: req.csrfToken(), username });
};

module.exports.verifyOTP = async (req, res) => {
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

        // ลบรหัส OTP หลังจากตรวจสอบสำเร็จ
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


module.exports.showResetPassword = (req, res) => {
    const error = req.flash('error');
    const success = req.flash('success');
    res.render('./forgot_password/reset-password', { error, success, csrfToken: req.csrfToken() });
};

module.exports.resetPassword = async (req, res) => {
    const { newPassword } = req.body;
    const { username } = req.session;

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            req.flash('error', 'ไม่พบผู้ใช้ที่ร้องขอการรีเซ็ตรหัสผ่าน');
            return res.redirect('/forgot-password');
        }

        // แฮ็ชรหัสผ่านใหม่
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        req.flash('success', 'รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบใหม่');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองอีกครั้ง');
        res.redirect('/reset-password');
    }
};

