const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const router = express.Router();

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

// Local authentication strategy
passport.use(
  new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Google Login Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Local Login Route
router.get('/login', (req, res) => {
  res.render('log/login', { title: 'Login Page' });
});
router.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: '/dashboard' }));

// Local Registration Route
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  const { username, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.render('register', { error: 'Username already exists' });
    }

    // Create a new user
    const newUser = new User({ username: username });
    newUser.setPassword(password);

    // Save the user to the database
    await newUser.save();

    // Log in the user immediately after registration
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/login-failure',
    })(req, res, next);
  } catch (error) {
    console.error(error);
    res.render('register', { error: 'Error during registration' });
  }
});

// Retrieve user data
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failure",
    successRedirect: "/dashboard",
  })
);

// login-failure
router.get('/login-failure', (req, res) => {
  res.send('Something went wrong...');
});

// Logout Route: Destroy user session
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

// New
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = router;