require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const path = require('path');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./server/models/User'); // Adjust the path if necessary
const moment = require('moment');
const bodyParser = require('body-parser');
const lineWebhook = require('./server/routes/lineWebhook');

const app = express();
const port = process.env.PORT || 5001;

// Connect to Database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON requests
app.use(express.static(path.join(__dirname, 'public')));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/docUploads', express.static(path.join(__dirname, 'docUploads')));
app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use('/webhook', lineWebhook);

// Flash middleware setup
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to handle due date validation and formatting
app.use((req, res, next) => {
  if (req.body.dueDate) {
    const dueDate = moment(req.body.dueDate, moment.ISO_8601, true); // Parsing ISO 8601 dates
    if (!dueDate.isValid()) {
      console.error('Invalid date format:', req.body.dueDate);
      req.flash('error', 'Invalid date format');
      return res.redirect('back');
    }
    req.body.dueDate = dueDate.toISOString(); // Standardize to ISO format for storage
  }
  next();
});

// Middleware to update lastActive on each request
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      req.user.lastActive = Date.now();
      await req.user.save();
    } catch (error) {
      console.error('Error updating lastActive:', error);
    }
  }
  next();
});

// Templating Engine setup
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes setup
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/spaceRoutes'));

app.use('/', require('./server/routes/taskRou/taskRoutes'));
app.use('/', require('./server/routes/taskRou/taskPageRoutes'));
app.use('/', require('./server/routes/taskRou/taskDetailRoutes'));
app.use('/', require('./server/routes/notiRoutes'));
app.use('/', require('./server/routes/subtaskRoutes'));
app.use('/', require('./server/routes/settingRoutes'));
app.use('/', require('./server/routes/userRoutes'));
app.use('/', require('./server/routes/collabRoutes'));


// Handle 404 errors
app.get('*', (req, res) => {
  res.status(404).render('404');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

