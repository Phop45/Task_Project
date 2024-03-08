exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  } else {
      if (req.originalUrl === '/login' || req.originalUrl === '/register' || req.originalUrl.startsWith('/public')) {
          return next();
      } else {
          res.redirect('/login');
      }
  }
};