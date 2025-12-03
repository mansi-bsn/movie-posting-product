const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const dirs = [
        path.join(__dirname, '../public/uploads/movies'),
        path.join(__dirname, '../public/uploads/actors'),
        path.join(__dirname, '../public/uploads/directors')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage factory for different directories
const createStorage = (uploadPath) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            // Generate unique filename: timestamp-randomnumber-originalname
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
            cb(null, name + '-' + uniqueSuffix + ext);
        }
    });
};

// Default storage (movies)
const storage = createStorage(path.join(__dirname, '../public/uploads/movies'));
const actorStorage = createStorage(path.join(__dirname, '../public/uploads/actors'));
const directorStorage = createStorage(path.join(__dirname, '../public/uploads/directors'));

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    // Allowed image types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Multiple image upload configuration (for poster + gallery)
const uploadMultiple = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10 // Maximum 10 files (1 poster + 9 gallery)
    },
    fileFilter: fileFilter
}).fields([
    { name: 'poster', maxCount: 1 },
    { name: 'gallery', maxCount: 9 }
]);

// Actor photo upload
const uploadActor = multer({
    storage: actorStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

// Director photo upload
const uploadDirector = multer({
    storage: directorStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

module.exports = { 
    upload, 
    uploadMultiple,
    uploadActor,
    uploadDirector
};

