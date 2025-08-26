const express = require('express');
const router = express.Router();
const connection = require('../../db');

// --------------------------------------------------------------------------------------------- //
// This file contains the routes that handle the insertions and updates in the announcements table,
// that the user chooses

// This is the router that is used to submit the examination information for the thesis 
router.post('/submit-examination-info', (req, res) => {
    // The variables that will be used and they are coming from the request body
    const { thesis_id, date, time, type, location_or_link } = req.body;

    // Check if all required fields are provided
    if (!thesis_id || !date || !time || !type || !location_or_link) {
        return res.status(400).json({ success: false, message: 'Missing data' });
    }

    // The sql query to insert the examination information into the database
    const sql = `
        INSERT INTO announcements (thesis_id, date, time, type, location_or_link)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    // Execute the query with the provided data, insert into the announcements table
    connection.query(sql, [thesis_id, date, time, type, location_or_link], (err, results) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

// This is the router that is used so that the student can update the examination choices he has previously made
router.post('/update-examination-info', (req, res) => {
    // The variables that will be used and they are coming from the request body
    const { thesis_id, date, time, type, location_or_link } = req.body;

    // Check if all required fields are provided
    if (!thesis_id || !date || !time || !type || !location_or_link) {
        return res.status(400).json({ success: false, message: 'Missing data' });
    }

    // The sql query to update the examination information in the database
    const sql = `
            UPDATE announcements
            SET date = ?, time = ?, type = ?, location_or_link = ?
            WHERE thesis_id = ?
    `;
    
    // Execute the query with the provided data, update the announcements table
    connection.query(sql, [date, time, type, location_or_link, thesis_id], (err, results) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

// This is the router that is used to get the examination information for a specific thesis 
// and it is used to display the examination information to the student
router.get('/get-examination-info/:thesis_id', (req, res) => {
    const thesisId = req.params.thesis_id;

    // The sql query to get the examination information for a specific thesis
    const sql = `
        SELECT date, time, type, location_or_link
        FROM announcements
        WHERE thesis_id = ?
    `;
    // Execute the query with the provided thesis ID
    connection.query(sql, [thesisId], (err, results) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ success: false });
        }
        // if (results.length === 0) {
        //     return res.status(404).json({ success: false, message: 'No examination info found' });
        // }

        res.json({ success: true, data: results[0] });
    });
});

module.exports = router;