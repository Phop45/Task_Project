// upload mindelware
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = 'docUploads/';


if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage to preserve the original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeFilename = file.originalname.replace(/[\s]/g, '_'); // Replace spaces with underscores
        cb(null, safeFilename);
    }
});

// File filter to accept only specific types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.docx', '.doc', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Set up the upload middleware with size limits (e.g., 5MB)
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter,
});

module.exports = upload;