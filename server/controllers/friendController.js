const Subject = require("../models/Subject");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.allFriend = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends').exec();
        res.render("friend/allFriend", {
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            friends: user.friends,
            layout: "../views/layouts/friend",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};