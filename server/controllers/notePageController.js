const Note = require("../models/Notes");
const mongoose = require("mongoose");

// หน้ารวมโน้ต
exports.noteDashboard = async (req, res) => {
  let perPage = 12;
  let page = req.query.page || 1;

  try {
    const notes = await Note.aggregate([
      { $sort: { updatedAt: -1 } },
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] },
          body: { $substr: ["$body", 0, 100] },
        },
      }
      ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    const count = await Note.count();

    res.render("notePage/index", {
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      notes,
      layout: "../views/layouts/notes",
      current: page,
      pages: Math.ceil(count / perPage),
    });

  } catch (error) {
    console.log(error);
  }
};

// กดเข้าไปดูโน้ต
exports.ViewNote = async (req, res) => {
  const note = await Note.findById({ _id: req.params.id })
    .where({ user: req.user.id })
    .lean();

  if (note) {
    res.render("notePage/view-note", {
      noteID: req.params.id,
      note,
      layout: "../views/layouts/notes",
      userName: req.user.firstName,
      userImage: req.user.profileImage
    });
  } else {
    res.send("Something went wrong.");
  }
};

// อัพเดทโน้ต
exports.UpdateNote = async (req, res) => {
  try {
    const noteId = req.params.id._id || req.params.id;
    const ObjectId = require('mongoose').Types.ObjectId;
    const noteObjectId = noteId instanceof Object ? noteId._id : noteId;

    await Note.findOneAndUpdate(
      { _id: noteObjectId },
      { title: req.body.title, body: req.body.body, updatedAt: Date.now() }
    ).where({ user: ObjectId(req.user.id) });

    req.session.userName = req.user.firstName;
    req.session.userImage = req.user.profileImage;
    res.redirect("/note");
  } catch (error) {
    console.log(error);
    res.send("Error updating note.");
  }
};

// Delete Note
exports.DeleteNote = async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.id }).where({ user: req.user.id });
    res.redirect("/note");
  } catch (error) {
    console.log(error);
  }
};

// GET / Add Notes
exports.AddNote = async (req, res) => {
  res.render("notePage/add", {
    userName: req.user.firstName,
    userImage: req.user.profileImage,
    layout: "../views/layouts/notes",
  });
};

// POST / Add Notes
exports.AddNoteSubmit = async (req, res) => {
  try {
    req.body.user = req.user.id;
    await Note.create(req.body);
    res.redirect("/note");
  } catch (error) {
    console.log(error);
  }
};

// Search Note
exports.SearchNote = async (req, res) => {
  try {
    res.render("notePage/search", {
      searchResults: "",
      layout: "../views/layouts/notes",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
    });
  } catch (error) {}
};

// POST / Search Notes
exports.SearchNoteSubmit = async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChars = searchTerm.replace(/[^\p{L}\p{N}\s]/gu, "");

    const searchResults = await Note.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
      ],
    }).where({ user: req.user.id });

    res.render("notePage/search", {
      searchResults,
      layout: "../views/layouts/notes",
      userName: req.user.firstName,
      userImage: req.user.profileImage,
    });
  } catch (error) {
    console.log(error);
  }
};
