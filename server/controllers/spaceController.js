//Space Controller
const Spaces = require('../models/Space');
const Space = require('../models/Space');
const mongoose = require("mongoose");
const moment = require("moment");
const multer = require("multer");
const path = require("path");
moment.locale('th');

exports.SpaceDashboard = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);

    const spaces = await Spaces.find({
      $or: [
        { user: userId },
        { collaborators: { $elemMatch: { user: userId } } }
      ],
      deleted: false
    })
      .populate('user', 'username profileImage')
      .populate('collaborators.user', 'username profileImage')
      .lean();

    res.render("space/space-dashboard", {
      spaces,
      user: req.user,
      layout: "../views/layouts/space"
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    res.status(500).send("Internal Server Error");
  }
};

// create space
exports.createSpace = async (req, res) => {
  try {
    const { SpaceName, SpaceDescription, spaceColor } = req.body;

    const newSpace = new Spaces({
      SpaceName,
      SpaceDescription,
      SpaceColor: spaceColor,
      user: req.user.id,
      collaborators: [
        {
          user: req.user.id,
          role: 'Leader'
        }
      ]
    });
    await newSpace.save();
    res.redirect("/space");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.deleteSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user.id;

    const space = await Spaces.findOne({
      _id: spaceId,
      $or: [{ user: userId }, { collaborators: { $elemMatch: { user: userId } } }],
    });

    if (!space) {
      return res.status(404).json({ success: false, error: "Space not found" });
    }

    // Soft delete by setting 'deleted' to true
    space.deleted = true;
    await space.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


// Show subjects that can Recover
exports.ShowRecover = async (req, res) => {
  try {
    const spaces = await Spaces.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id), deleted: true } },
      { $project: { SpaceName: 1, SpaceDescription: 1 } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "spaces",
          as: "tasks",
        },
      },
      {
        $addFields: {
          taskCount: { $size: "$tasks" },
        },
      },
    ]).exec();

    res.render("space/space-recover", {
      spaces: spaces,
      userName: req.user.username,
      usernameId: req.user.userid,
      userImage: req.user.profileImage,
      layout: "../views/layouts/space",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Recover space
exports.recoverSpace = async (req, res) => {
  try {
    const space = await Spaces.findByIdAndUpdate(
      req.params.id,
      { deleted: false },
      { new: true }
    );

    if (!space) {
      return res.status(404).json({ success: false, error: "Space not found" });
    }

    res.redirect('/space');
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const storage = multer.diskStorage({
  destination: "./public/spaceictures/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const spaceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      "/Users/p/Desktop/10:04_TaskP/public/spaceictures"
    );
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: spaceStorage, // เปลี่ยนเป็น spaceStorage
  limits: { fileSize: 100000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("SpacePicture");

// ตรวจสอบประเภทไฟล์
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|bmp|svg/; // เพิ่มประเภทที่อนุญาต
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น!");
  }
}

module.exports.edit_Update_SpacePicture = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // กรณีเกิดข้อผิดพลาดในขณะอัปโหลดไฟล์
      res.send(
        '<script>alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' +
        err +
        '"); window.location="/space";</script>'
      );
    } else {
      if (req.file == undefined) {
        // กรณีไม่ได้เลือกไฟล์
        res.send(
          '<script>alert("ไม่ได้เลือกไฟล์! กรุณาเลือกไฟล์รูปภาพ"); window.location="/space";</script>'
        );
      } else {
        try {
          // ค้นหา space จาก id และอัปเดตรูปภาพ
          const space = await Space.findById(req.params.id);
          space.SpacePicture = "/spaceictures/" + req.file.filename;
          await space.save();

          // หลังจากบันทึกเสร็จสิ้น
          res.send(
            '<script>alert("อัปโหลดรูปภาพสำเร็จ"); window.location="/space";</script>'
          );
        } catch (error) {
          console.log(error);
          res.send(
            '<script>alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' +
            error.message +
            '"); window.location="/space";</script>'
          );
        }
      }
    }
  });
};

module.exports.edit_Update_SpaceName = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).send('<script>alert("ไม่พบพื้นที่งาน!"); window.location="/space";</script>');
    }

    space.SpaceName = req.body.SpaceName;
    await space.save();

    res.redirect('/space'); // เปลี่ยนเป็น redirect เพื่อโหลดใหม่โดยไม่มีแจ้งเตือน
  } catch (error) {
    console.log(error);
    res.send('<script>alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message + '"); window.location="/space";</script>');
  }
};