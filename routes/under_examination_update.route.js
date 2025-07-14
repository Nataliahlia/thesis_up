const express = require('express');
const router = express.Router();
const connection = require('../db');
const multer = require('multer');
const path = require('path');

// Where the file will be stored
const storage = multer.diskStorage({
    // Define the storage location and filename
    destination: function (req, file, cb) {
        cb(null, 'uploads/progress_files');
    },

    filename: function (req, file, cb) {

        const timestamp = Date.now();                           // Current timestamp to ensure unique filenames 
        const ext = path.extname(file.originalname);            // Gets the file extension
        const base = path.basename(file.originalname, ext);     // Gets the base name of the file without extension

        // This is used so that the filename is safe for storage
        const safeBase = base
            .normalize('NFD')                     // Clear diacritics
            .replace(/[\u0300-\u036f]/g, '')      // Remove diacritics
            .replace(/[^\w.-]/gi, '_');           // Remove all non-safe characters

        const safeFilename = `${timestamp}-${safeBase}${ext}`;  // Create a safe filename with timestamp
        cb(null, safeFilename);                                 // Callback function of multer to save the file
    }
});

// Create the multer instance with the storage configuration
const upload = multer({ storage: storage });

router.post('/under-examination-upload', upload.single('progressFile'), (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'student') {
            return res.status(403).json({ error: 'Unauthorized' });
    }

    // Ιf the file is not uploaded, return an error
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const studentId = req.session.user.id;
    const filePath = req.file.filename;                     // The filename stored through multer
    
    // The additional link/links from the form, if provided, stored through multer
    let links = req.body['progressLinks[]'];
    if (!links) links = [];
    else if (typeof links === 'string') links = [links]; // only one link

    // Ensure links are in a proper format
    const progressLinksJSON = JSON.stringify(links);

    // The query we will use to update the thesis_topic table
    const query = `
        UPDATE thesis_topic 
        SET draft_file = ?, additional_links = ?
        WHERE student_id = ?
    `;

    // Perform the database update
    connection.query(query, [filePath, progressLinksJSON, studentId], (err, result) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database update error' });
        }
        res.json({ success: true, message: 'Progress file uploaded successfully' });
    });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;