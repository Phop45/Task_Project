const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');

module.exports.setting_get = async (req, res) => {
    try {
        res.render("setting/setting-profile", {
            userName: req.user.username,
            userImage: req.user.profileImage,
            userId: req.user._id, // เพิ่ม userId นี้
            layout: "../views/layouts/setting",
        })
    } catch (error) {
        console.log(error)
    }
}

// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

  // Init Upload
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('profileImage');

  // Check File Type
  function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }

  // Update user profile image
module.exports.edit_Update_profileImage = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            res.render('error', {
                message: err
            });
        } else {
            if (req.file == undefined) {
                res.render('error', {
                    message: 'Error: No File Selected!'
                });
            } else {
                try {
                    // Update user profile image in database
                    const user = await User.findById(req.params.id);
                    user.profileImage = '/uploads/' + req.file.filename;
                    await user.save();
                    res.redirect('/setting');
                } catch (error) {
                    console.log(error);
                    res.render('error', {
                        message: 'Server Error'
                    });
                }
            }
        }
    });
};

// Update username
module.exports.edit_Update_username = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.username = req.body.username;
        await user.save();
        res.redirect('/setting');
    } catch (error) {
        console.log(error);
        res.render('error', {
            message: 'Server Error'
        });
    }
};