// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id }) || await User.findOne({ googleEmail: profile.emails?.[0]?.value });

        if (user) {
          user.lastActive = Date.now();
          user.isOnline = true;

          if (!user.googleId) user.googleId = profile.id;
          if (!user.profileImage) user.profileImage = profile.photos?.[0]?.value || "/img/profileImage/Profile.jpeg";

          await user.save();
          return done(null, user);
        } else {
          const newUser = new User({
            googleId: profile.id || uuidv4(),
            googleEmail: profile.emails?.[0]?.value || "",
            profileImage: profile.photos?.[0]?.value || "/img/profileImage/Profile.jpeg",
            role: "user",
            lastActive: Date.now(),
            isOnline: true,
            userid: uuidv4(),
          });

          if (!newUser.googleEmail) {
            throw new Error("Email is required for user registration.");
          }

          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, null);
      }
    }
  )
);