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

router.post('/under-examination-upload', upload.fields([ { name: 'progressFile' }, { name: 'progressLinks[]' } ]), async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'student') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const studentId = req.session.user.id;          // Get the student ID from the session
        const file = req.files?.progressFile?.[0];      // Get the uploaded file from the request, the file that is uploaded through multer
        const filePath = file?.filename || null;        // If a file was uploaded (through multer), get its filename, else set it to null

        let newLinks = req.body['progressLinks[]'] || req.body.progressLinks || []; // Get the new links form the form 
        if (typeof newLinks === 'string') { 
            newLinks = [newLinks];                    // If the links are sent as a string, convert them to an array
        }

        // Query to get the existing draft file and links for the student
        const [rows] = await connection.promise().query(                        
        `SELECT draft_file, additional_links FROM thesis_topic WHERE student_id = ?`,
        [studentId]
        );

        // This returns the existing draft file if it exists, otherwise null -> used later to check if a file has been uploaded before
        const existingDraft = rows.length > 0 ? rows[0].draft_file : null;

        let existingLinks = [];     // This will hold the existing links from the database
        // The if executes if there are existing rows for the student with links
        if (rows.length > 0 && rows[0].additional_links) {
            try {
                const parsed = JSON.parse(rows[0].additional_links);    // Get the existing links from the database and parse them
                if (Array.isArray(parsed)) {    
                    existingLinks = parsed;                             // If the existing links are an array, use them
                }
            } catch {
                existingLinks = [];
            }
        }

        // Merge existing links with new links, ensuring no duplicates
        const allLinks = [...new Set([...existingLinks, ...newLinks])];

        // Check if a file needs to be uploaded
        if (!filePath && !existingDraft && allLinks.length > 0) {
            return res.status(400).json({ error: 'Πρέπει πρώτα να ανεβάσετε αρχείο.' });
        }

        // New file uploaded and no previous file exists
        if (filePath) {
            // Query to save the new file and links
            const query = `
                UPDATE thesis_topic
                SET draft_file = ?, additional_links = ?
                WHERE student_id = ?
            `;
            // Query to save the new file and links, done in an async way
            await connection.promise().query(query, [filePath, JSON.stringify(allLinks), studentId]);
            // Return success message
            return res.json({ success: true, message: 'File and links uploaded successfully.' });
        }

        // This executes if no new file is uploaded, but there are links to update -> old file exists
        const query = `
            UPDATE thesis_topic
            SET additional_links = ?
            WHERE student_id = ?
        `;
        // Async way and success message
        await connection.promise().query(query, [JSON.stringify(allLinks), studentId]);
        return res.json({ success: true, message: 'Links uploaded successfully.' });

    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;