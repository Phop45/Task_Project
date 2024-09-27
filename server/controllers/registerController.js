const User = require('../models/User');

module.exports.storeUser = async (req, res) => {
    try {
        // Check if the passwords match
        if (req.body.password !== req.body.confirmPassword) {
            req.flash('validationErrors', ['รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน']);
            req.flash('data', req.body);
            return res.redirect('/register');
        }

        // Check if username or email already exists
        const userExists = await User.findOne({ username: req.body.username });
        const emailExists = await User.findOne({ googleEmail: req.body.googleEmail });

        if (userExists) {
            req.flash('validationErrors', ['ชื่อผู้ใช้นี้มีอยู่แล้ว']);
            req.flash('data', req.body);
            return res.redirect('/register');
        }

        if (emailExists) {
            req.flash('validationErrors', ['อีเมลนี้มีอยู่แล้ว']);
            req.flash('data', req.body);
            return res.redirect('/register');
        }

        // Create new user
        await User.create({
            username: req.body.username,
            password: req.body.password,
            googleEmail: req.body.googleEmail,
        });

        console.log("User registered successfully!");
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        let validationErrors = [];
        if (error.name === 'ValidationError') {
            validationErrors = Object.keys(error.errors).map(key => error.errors[key].message);
        } else {
            validationErrors.push('เกิดข้อผิดพลาดในการลงทะเบียน');
        }
        req.flash('validationErrors', validationErrors);
        req.flash('data', req.body);
        res.redirect('/register');
    }
};

module.exports.register = (req, res) => {
    const errors = req.flash('validationErrors');
    const data = req.flash('data')[0] || {};

    res.render('./login_register/register', {
        errors: errors.length > 0 ? errors : null,
        username: data.username || "",
        googleEmail: data.googleEmail || "", // Add email to be rendered if form submission fails
        password: data.password || "",
        csrfToken: req.csrfToken()
    });
};

