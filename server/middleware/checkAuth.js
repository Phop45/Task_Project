exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
      return next(); // User is authenticated, allow access to the route
  } else {
      // Check if the requested URL is the login page or any other public route
      // Add more routes as needed
      if (req.originalUrl === '/login' || req.originalUrl === '/register' || req.originalUrl.startsWith('/public')) {
          return next(); // Allow access to public routes
      } else {
          // Redirect to login page for all other routes
          res.redirect('/login'); // Assuming your login route is '/login', adjust it accordingly
      }
  }
};