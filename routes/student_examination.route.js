const express = require('express');
const router = express.Router();
const connection = require('../db');

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

router.get('/get-grades/:thesis_id', async (req, res) => {
    console.log('Serving thesis topics page');

    // Get thesisId from query or body (adjust as needed)
    const thesisId = req.params.thesis_id;
    if (!thesisId) {
        return res.status(400).json({ error: 'Missing thesisId parameter.' });
    }

    // SQL query to fetch the grades from the three committee members
    const query = `
        SELECT 
            tc.thesis_id,
            tc.professor_id,
            tc.grade,
            p.name AS professor_name,
            p.surname AS professor_surname,
            CONCAT(p.name, ' ', p.surname) AS professor_full_name,
            CASE 
                WHEN tt.instructor_id = tc.professor_id THEN 'Instructor'
                ELSE 'Member'
            END AS member_role
        FROM thesis_comments tc
        JOIN professor p ON tc.professor_id = p.professor_id
        JOIN thesis_topic tt ON tc.thesis_id = tt.thesis_id
        WHERE tc.thesis_id = ?;
    `;

    try {
        const [rows] = await connection.promise().query(query, [thesisId]);
        return res.json({ success: true, grades: rows });
    } catch (err) {
        console.error('Error fetching grades:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;