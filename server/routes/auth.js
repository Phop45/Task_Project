const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const router = express.Router();

passport.use(new LocalStrategy(User.authenticate()));

// Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const newUser = {
        googleId: profile.id,
        displayName: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImage: profile.photos[0].value,
      };

      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          done(null, user);
        } else {
          user = await User.create(newUser);
          done(null, user);
        }
      } catch (error) {
        console.log(error);
      }
    }
  )
);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failure",
    successRedirect: "/subject",
  })
);

// Login
router.get('/login', (req, res) => {
  res.render('log/login');
});
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      if (!user) {
          return res.redirect('/login-failure');
      }

      const rememberMe = req.body.remember === 'on';
      if (rememberMe) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }

      if (!user.profileImage) {
        user.profileImage = '/img/images.jpeg';
        user.save();
      }

      req.logIn(user, (err) => {
          if (err) { return next(err); }
          return res.redirect('/subject');
      });
  })(req, res, next);
});

// Register
router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const newUser = new User({ username, password });
    User.register(newUser, password, (err, user) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      passport.authenticate('local')(req, res, () => {
        res.redirect('/subject');
      });
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/register', (req, res) => {
  res.render('log/register');
});

// login-failure
router.get('/login-failure', (req, res) => {
  res.send('Something went wrong...');
});


// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error logging out');
    }
    req.session.destroy((error) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error logging out');
      }
      res.redirect('/');
    });
  });
});

// Presist user data after successful authentication
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = router;