const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authController = require("../controllers/authController");
const router = express.Router();
const User = require("../models/User");

// Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    authController.googleCallback
  )
);

// Serialize user into session
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth authentication route
router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.error("Error during Google authentication:", err);
      return res.redirect("/login-failure");
    }

    if (!user) {
      if (info?.message === "redirect_to_google_register") {
        return res.redirect(`/googleRegister?googleEmail=${info.googleEmail}`);
      }
      return res.redirect("/login-failure");
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("Login error:", loginErr);
        return res.redirect("/login-failure");
      }
      console.log("User logged in:", user); // Debug log to confirm the login is successful
      return res.redirect("/space");
    });
  })(req, res, next);
});




// Login
router.get("/login", authController.loginPage);
router.post("/login", authController.login);

// Register
router.post("/user/register", authController.registerUser);
router.get("/register", authController.registerPage);

// Google Registration
router.get("/googleRegister", authController.googleRegisterPage);
router.post("/google-register", authController.googleRegister);

// Login failure
router.get("/login-failure", authController.loginFailure);

// Logout
router.get("/logout", authController.logout);

// Forgot Password
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.resendOTP);

// Route for OTP verification
router.get('/verify-otp', authController.showVerifyOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Routes for reset password
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;