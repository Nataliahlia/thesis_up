const express = require('express');
const router = express.Router();
const connection = require('../../db');
const multer = require('multer');
const path = require('path');

// -------------------------------------------------------------------- //
// This is the file that handles everything that is related to the thesis,
// like the updates on the thesis, the uploads of thesis file or links

// Firstly we define the place where the file uploads (thesis file) will be uploaded 
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
            .replace(/[^\w.-]/gi, '_')           // Remove all non-safe characters

        const safeFilename = `${timestamp}-${safeBase}${ext}`;  // Create a safe filename with timestamp
        cb(null, safeFilename);                                 // Callback function of multer to save the file
    }
});

// Create the multer instance with the storage configuration
const upload = multer({ storage: storage });

// This is the router that is used so that we can get the thesis details, 
// this is used in many places throughout the javascript implementation
router.get('/mythesis-details', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const studentId = req.session.user.id;
  const query = `
    SELECT 
        tt.thesis_id,
        tt.title, 
        tt.description, 
        tt.pdf, 
        tt.state,
        tt.draft_file,
        tt.additional_links,
        tt.member1,
        tt.member2,
        tt.instructor_id,
        tt.nimertis_link,
        DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
        instructor.name as instructor_name,
        instructor.surname as instructor_surname,
        m1.name as mentor_name,
        m1.surname as mentor_surname,
        m2.name as mentortwo_name,
        m2.surname as mentortwo_surname,
        CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
        CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name,
        CONCAT(instructor.name, ' ', instructor.surname) as full_instructor_name
    FROM thesis_topic tt
    LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
    LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
    LEFT JOIN professor instructor ON tt.instructor_id = instructor.professor_id
    WHERE student_id = ?`;

    connection.query(query, [studentId], (err, results) => {
        if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Database error' });
        }

        res.json(results); // Send the thesis info to the frontend
    });
});

// This is the router that is used to upload the thesis file and maybe if the student wants some additional links
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

// This is the router that handles the deletion of links 
router.post('/remove-link', async (req, res) => {
    const { thesis_id, link } = req.body;   // Get the data from the request body

    // Check the data 
    if (!thesis_id || !link) {
        return res.json({ success: false, error: 'Missing thesis_id or link' });
    }

    try {
        // Fetch the current additional_links array
        const [rows] = await connection.promise().query(
            'SELECT additional_links FROM thesis_topic WHERE thesis_id = ?',
            [thesis_id]
        );
        if (!rows.length) {
            return res.json({ success: false, error: 'Thesis not found' });
        }

        let links = [];
        try {
            links = JSON.parse(rows[0].additional_links) || [];
        } catch {
            links = [];
        }

        // Remove the link, which the student chose to remove, from the array
        const newLinks = links.filter(l => l !== link);

        // Update the row with the new array, so that it will not include the removed link
        await connection.promise().query(
            'UPDATE thesis_topic SET additional_links = ? WHERE thesis_id = ?',
            [JSON.stringify(newLinks), thesis_id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: 'Database error' });
    }
});

// This is the router that is used to save the nimertis link
router.post('/save-nimertis-link', async (req, res) => {
    // Get the information from the request body
    const { thesis_id, nimertis_link } = req.body;

    // Validate the information
    if (!thesis_id || !nimertis_link) {
        return res.status(400).json({ success: false, error: 'Missing data' });
    }

    try {
        // The query to update the nimertis link in the database
        const query = `UPDATE thesis_topic SET nimertis_link = ? WHERE thesis_id = ?`;
        await connection.promise().query(query, [nimertis_link, thesis_id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

module.exports = router;