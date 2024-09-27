const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');


// ฟังก์ชันสำหรับสุ่ม userid
function generateUserId() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let userid = '';
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

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  prompt: 'select_account'
},
async (accessToken, refreshToken, profile, done) => {
  console.log("Google Profile:", profile);

  try {
    // ตรวจสอบว่ามีการใช้อีเมลนี้แล้วหรือไม่
    let existingUser = await User.findOne({ googleEmail: profile.emails[0].value });

    if (existingUser) {
      // ถ้าอีเมลมีการใช้งานแล้ว แต่ยังไม่มี googleId ให้เพิ่ม googleId
      if (!existingUser.googleId) {
        existingUser.googleId = profile.id;
        await existingUser.save();
      }
      return done(null, existingUser);
    }

    // สร้างผู้ใช้ใหม่ถ้าไม่มีการใช้อีเมลนี้
    let username = generateUsername();
    let userid = generateUserId();

    // Ensure the username and userid are unique
    while (await User.findOne({ username })) {
      username = generateUsername();
    }
    while (await User.findOne({ userid })) {
      userid = generateUserId();
    }

    const newUser = new User({
      username: username,
      userid: userid,
      googleId: profile.id,
      googleEmail: profile.emails[0].value,
      profileImage: profile.photos[0].value  // ใช้รูปภาพจาก Google Profile
    });
    

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err, null);
  }
}));


passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);  // ตรวจสอบว่ามีการเรียก serializeUser
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("Deserializing user:", user);  // ตรวจสอบว่ามีการเรียก deserializeUser
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});



