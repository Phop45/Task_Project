//subjectController.js
const Subject = require('../models/Subject');
const User = require('../models/User'); 
const mongoose = require("mongoose");
const moment = require("moment");
moment.locale('th');

// show subject dashboard page
exports.SubDashboard = async (req, res) => {
    try {
        const subjects = await Subject.aggregate([
            { 
                $match: { 
                    $or: [
                        { user: mongoose.Types.ObjectId(req.user.id) },
                        { collaborators: mongoose.Types.ObjectId(req.user.id) }
                    ],
                    deleted: false 
                } 
            },
            { $project: { SubName: 1, SubDescription: 1, createdAt: 1, collaborators: 1 } },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "subject",
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        subjects.forEach(subject => {
            subject.createdAt = moment(subject.createdAt).format('LL');
        });

        // Fetch users and their profile images
        let users = await User.find();
        users = users.filter(user => user._id.toString() !== req.user._id.toString());
        const uniqueUsers = Array.from(new Set(users.map(user => user._id.toString())))
            .map(id => users.find(user => user._id.toString() === id));

        // Create a map for user profile images
        const userProfileImages = uniqueUsers.reduce((acc, user) => {
            acc[user._id.toString()] = user.profileImage;
            return acc;
        }, {});

        res.render("subject/sub-dasboard", {
            subjects: subjects,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            users: uniqueUsers, 
            userProfileImages: userProfileImages,  // Pass userProfileImages to the template
            currentUser: req.user,
            layout: "../views/layouts/subject",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};



// create subject
exports.createSubject = async (req, res) => {
    try {
        const { SubName, SubDescription, SubjectCode, Professor, collaborators } = req.body;

        const newSubject = new Subject({
            SubName,
            SubDescription,
            SubjectCode,
            Professor,
            user: req.user.id,
            collaborators: Array.isArray(collaborators) ? collaborators : [collaborators]
        });

        await newSubject.save();
        res.redirect("/subject");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// delete subject
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, error: "Subject not found" });
        }
        subject.deleted = true;
        await subject.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Show subkect that can Recover
exports.ShowRecover = async (req, res) => {
    try {
        const subjects = await Subject.aggregate([
            { $match: { user: mongoose.Types.ObjectId(req.user.id), deleted: true } },
            { $project: { SubName: 1, SubDescription: 1 } },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "subject",
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        const count = await Subject.countDocuments({ user: req.user.id, deleted: false });

        // Fetch all users
        const users = await User.find();

        res.render("subject/sub-recover", {
            subjects: subjects,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            users: users,  // Pass users to the template
            layout: "../views/layouts/subject",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};


// recover Subject
exports.recoverSubject = async (req, res) => {
    const subjectId = req.params.id;
    try {
        const subject = await Subject.findByIdAndUpdate(subjectId, { deleted: false }, { new: true });
        if (!subject) {
            return res.status(404).json({ success: false, error: 'Subject not found or you do not have permission to recover it.' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};