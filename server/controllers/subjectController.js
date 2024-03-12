//subjectController.js
const Subject = require("../models/Subject");
const Task = require("../models/Task");
const mongoose = require("mongoose");

// Get Subject dashboard
exports.SubDashboard = async (req, res) => {
  let perPage = 12;
  let page = req.query.page || 1;
  const locals = {
    title: "Subject",
    description: "รวมรายวิชา",
  };
  try {
    const subjects = await Subject.aggregate([
      { $sort: { createdAt: -1 } },
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $project: { SubName: 1, SubDescription: 1 } }
    ]).exec();

    const count = await Subject.countDocuments();
    res.render("subject/sub-dasboard", {
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      locals,
      subjects,
      layout: "../views/layouts/subject",
    });
  }
  catch (error) {
    console.log(error);
  };
};

// Create Subject
exports.createSubject = async (req, res) => {
  try {
    const newSubject = new Subject({
      SubName: req.body.SubName,
      SubDescription: req.body.SubDescription,
      user: req.user.id
    });
    await newSubject.save();
    res.redirect("/subject");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Delete Subject
exports.deleteSubject = async (req, res) => {
  const subjectId = req.params.id;
  try {
    const subject = await Subject.findOne({ _id: subjectId, user: req.user.id });
    if (!subject) {
      return res.status(404).send('Subject not found or you do not have permission to delete it.');
    }
    await Subject.findByIdAndRemove(subjectId);
    res.redirect("/subject");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};