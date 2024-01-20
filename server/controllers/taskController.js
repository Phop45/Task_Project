const Task = require('../models/Task');
const multer = require('multer');
const upload = multer();

module.exports.renderTaskPage = (req, res) => {
    const userName = req.user ? req.user.firstName : 'Guest';
    res.render('task', { userName, layout: null });
};

module.exports.renderAddTaskPage = (req, res) => {
    const userName = req.user ? req.user.firstName : 'Guest';
    res.render('addTask', { userName });
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


