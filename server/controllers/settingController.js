const mongoose = require("mongoose");

exports.viewSetting = async (req, res) => {
    try {
        res.render("setting/setting-profile", {
                userName: req.user.firstName,
                userImage: req.user.profileImage,
                layout: "../views/layouts/setting",
        });
    }
    catch (error) {
        console.log(error);
    };
}