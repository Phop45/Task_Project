const Task = require('../models/Task');
const multer = require('multer');

module.exports.renderTaskPage = (req, res) => {
    const userName = req.user ? req.user.firstName : 'Guest';
    const userImage = req.user ? req.user.profileImage : '/default-profile-image.jpg'; // Replace with the default image path
    res.render('task', { userName, userImage, layout: null });
};

module.exports.renderAddTaskPage = (req, res) => {
    const userName = req.user ? req.user.firstName : 'Guest';
    const userImage = req.user ? req.user.profileImage : '/default-profile-image.jpg'; // Replace with the default image path
    res.render('addTask', { userName, userImage });
};

module.exports.createTask_post = async (req, res) => {
    try {
        const { taskname, taskdetail } = req.body;
        const tasks = req.body.tasks || [];

        const createTask = new Task({
            taskname,
            taskdetail,
            listaddtodo: tasks
        });

        if (req.files && req.files.myfile) {
            const file = req.files.myfile[0];
            createTask.attachedFiles = [{
                fileName: file.originalname,
                data: file.buffer,
                contentType: file.mimetype
            }];
        }

        await createTask.save();
        res.redirect('task');
    } catch (err) {
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
};


