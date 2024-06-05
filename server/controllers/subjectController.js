//subjectController.js
const Subject = require("../models/Subject");
const mongoose = require("mongoose");
const moment = require("moment");
moment.locale('th');

// รวมงาน
exports.SubDashboard = async (req, res) => {
    try {
        const subjects = await Subject.aggregate([
            { $match: { user: mongoose.Types.ObjectId(req.user.id), deleted: false } },
            { $project: { SubName: 1, SubDescription: 1, createdAt: 1 } },
            {
                // join กับ collection "tasks"
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "subject",
                    as: "tasks"
                }
            }, {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        subjects.forEach(subject => {
            subject.createdAt = moment(subject.createdAt).format('LL');
        });

        const count = await Subject.countDocuments({ user: req.user.id, deleted: false });
        res.render("subject/sub-dasboard", {
            subjects: subjects,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            layout: "../views/layouts/subject",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// สร้างวิชา
exports.createSubject = async (req, res) => {
    try {
        const newSubject = new Subject({
            SubName: req.body.SubName,
            SubDescription: req.body.SubDescription,
            SubjectCode: req.body.SubjectCode,
            Professor: req.body.Professor,
            user: req.user.id
        });
        await newSubject.save();
        res.redirect("/subject");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// ลบวิชา
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

// หน้าแสดงการกู้คืนวิชา
exports.SubRecover = async (req, res) => {
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
            }, {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        const count = await Subject.countDocuments({ user: req.user.id, deleted: false });
        res.render("subject/sub-recover", {
            subjects: subjects,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            subjects,
            layout: "../views/layouts/subject",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// กู้คืนวิชา
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