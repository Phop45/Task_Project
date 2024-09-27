const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.get('/login', loginController.login);
router.post('/user/login', loginController.loginUser);
router.get('/logout', loginController.logout);

// Routes for forgot password
router.get('/forgot-password', loginController.showForgotPassword); // ไม่เปลี่ยนแปลง
router.post('/forgot-password', loginController.resendOTP);

// Route for OTP verification
router.get('/verify-otp', loginController.showVerifyOTP);
router.post('/verify-otp', loginController.verifyOTP);
router.post('/resend-otp', loginController.resendOTP);

// Routes for reset password
router.get('/reset-password', loginController.showResetPassword);
router.post('/reset-password', loginController.resetPassword);

module.exports = router;
