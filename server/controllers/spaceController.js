//Space Controller
const Spaces = require('../models/Space');
const User = require('../models/User');
const mongoose = require("mongoose");
const moment = require("moment");
moment.locale('th');

// show subject dashboard page
exports.SpaceDashboard = async (req, res) => {
    try {
        const spaces = await Spaces.aggregate([
            { 
                $match: { 
                    $or: [
                        { user: mongoose.Types.ObjectId(req.user.id) },
                        { collaborators: mongoose.Types.ObjectId(req.user.id) }
                    ],
                    deleted: false 
                } 
            },
            { $project: { SpaceName: 1, SpaceDescription: 1, createdAt: 1, collaborators: 1 } },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "Spaces",
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        res.render("space/space-dashboard", {
            spaces: spaces,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            currentUser: req.user,
            layout: "../views/layouts/space",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// create space
exports.createSpace = async (req, res) => {
    try {
        const { SpaceName, SpaceDescription, collaborators } = req.body;

        const newSpace = new Spaces({
            SpaceName,
            SpaceDescription,
            user: req.user.id,
            collaborators: Array.isArray(collaborators) ? collaborators : [collaborators]
        });

        await newSpace.save();
        res.redirect("/space");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// delete space
exports.deleteSpace = async (req, res) => {
    try {
        const spaceId = req.params.id;
        const userId = req.user.id;

        const space = await Spaces.findOne({
            _id: spaceId,
            $or: [
                { user: userId },
                { collaborators: userId }
            ],
        });

        if (!space) {
            return res.status(404).json({ success: false, error: "Space not found" });
        }
        space.deleted = true;
        await space.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


// Show subkect that can Recover
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
                    as: "tasks"
                }
            },
            {
                $addFields: {
                    taskCount: { $size: "$tasks" }
                }
            }
        ]).exec();

        res.render("space/space-recover", {
            spaces: spaces,
            userName: req.user.firstName,
            userImage: req.user.profileImage,
            layout: "../views/layouts/space",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};


// recover Space
exports.recoverSpace = async (req, res) => {
    const spaceId = req.params.id;
    try {
        const space = await Spaces.findByIdAndUpdate(spaceId, { deleted: false }, { new: true });
        if (!space) {
            return res.status(404).json({ success: false, error: 'Space not found or you do not have permission to recover it.' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


exports.addMember = async (req, res) => {
    const { searchQuery, role } = req.body;
    const spaceId = req.spaceId;  // Assuming spaceId is available from the middleware or session

    try {
        const user = await User.findOne({
            $or: [
                { email: searchQuery },
                { username: searchQuery },
                { userid: searchQuery }
            ]
        });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const space = await Space.findById(spaceId);

        if (!space) {
            return res.json({ success: false, message: 'Space not found' });
        }

        // Check if user is already a member
        if (space.members.some(member => member._id.equals(user._id))) {
            return res.json({ success: false, message: 'User is already a member' });
        }

        // Add member to space
        space.members.push({ user: user._id, role });
        await space.save();

        res.json({ success: true, message: 'Member added successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'An error occurred' });
    }
};

exports.updateMemberRole = async (req, res) => {
    const { memberId, newRole } = req.body;
    const spaceId = req.spaceId;

    try {
        const space = await Space.findById(spaceId);

        const member = space.members.find(member => member._id.equals(memberId));
        if (!member) {
            return res.json({ success: false, message: 'Member not found' });
        }

        member.role = newRole;
        await space.save();

        res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Failed to update role' });
    }
};

// Remove Member from Space
exports.removeMember = async (req, res) => {
    const { memberId } = req.body;
    const spaceId = req.spaceId;

    try {
        const space = await Space.findById(spaceId);
        space.members = space.members.filter(member => !member._id.equals(memberId));

        await space.save();
        res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Failed to remove member' });
    }
};