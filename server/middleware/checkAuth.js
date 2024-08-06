const Subject = require('../models/Subject'); // Adjust the path as needed
const User = require('../models/User');

exports.isLoggedIn = async function (req, res, next) {
    if (req.isAuthenticated()) {
        // If the route is for accessing a subject, check subject access
        if (req.originalUrl.startsWith('/subject')) {
            const subjectId = req.params.id || req.body.subjectId; // Adjust based on your route structure
            if (subjectId) {
                try {
                    const subject = await Subject.findById(subjectId);
                    if (!subject || (!subject.user.equals(req.user._id) && !subject.collaborators.includes(req.user._id))) {
                        return res.status(403).send("You do not have permission to access this subject.");
                    }
                } catch (error) {
                    console.log(error);
                    return res.status(500).send("Internal Server Error");
                }
            }
        }
        return next();
    } else {
        if (req.originalUrl === '/login' || req.originalUrl === '/register' || req.originalUrl.startsWith('/public')) {
            return next();
        } else {
            res.redirect('/login');
        }
    }
};