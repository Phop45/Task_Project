const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

exports.sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const newRequest = new FriendRequest({
      sender: req.user._id,
      receiver: receiverId,
    });
    await newRequest.save();
    res.redirect('/notifications');
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (request && request.receiver.equals(req.user._id)) {
      request.status = 'accepted';
      await request.save();

      const user = await User.findById(req.user._id);
      const sender = await User.findById(request.sender);

      user.friends.push(sender._id);
      sender.friends.push(user._id);

      await user.save();
      await sender.save();

      res.redirect('/notifications');
    } else {
      res.status(403).send("Unauthorized action");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.viewNotifications = async (req, res) => {
  try {
    const receivedRequests = await FriendRequest.find({ receiver: req.user._id, status: 'pending' }).populate('sender');
    const sentRequests = await FriendRequest.find({ sender: req.user._id }).populate('receiver');

    res.render('../views/layouts/notifications', {
        receivedRequests: receivedRequests,
        sentRequests: sentRequests,
        userName: req.user.firstName,
        userImage: req.user.profileImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};