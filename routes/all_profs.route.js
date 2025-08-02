const express = require('express');
const router = express.Router();
const connection = require('../db');

// Return all professors excluding the instructor of a specific thesis
router.get('/all-professors', async (req, res) => {

    try {
        // Get the thesis_id from query parameters
        const { thesis_id } = req.query; 

        // Access the database to find the instructor of the thesis
        const [instructorResult] = await connection.promise().query(
            `SELECT p.professor_id 
            FROM thesis_topic t
            JOIN professor p ON p.professor_id = t.instructor_id
            WHERE t.thesis_id = ?`,
            [thesis_id]
        );

        const instructorId = instructorResult?.[0]?.professor_id;   // Get the instructor's ID if it exists

        // Get all professors, excluding the instructor
        const [professors] = await connection.promise().query(
            `SELECT professor_id, CONCAT(name, ' ', surname) AS full_name
            FROM professor
            ${instructorId ? 'WHERE professor_id != ?' : ''}`,
            instructorId ? [instructorId] : []
        );

        res.json(professors);
        } catch (err) {
            console.error('Σφάλμα στη λήψη καθηγητών:', err);
            res.status(500).json({ error: 'Σφάλμα λήψης καθηγητών' });
        }
});

// Save the invitation to the thesis committee
router.post('/send-committee-invitation', async (req, res) => {
    // Get the thesis_id and professor_id from the request body
    const { thesis_id, professor_id } = req.body;

    // Validate request body
    if (!thesis_id || !professor_id) {
        return res.status(400).json({ success: false, error: 'Λείπουν δεδομένα.' });
    }

    // Insert the invitation into the database
    try {
        const [result] = await connection.promise().query(
            `INSERT INTO thesis_committee (thesis_id, professor_id, role, invitation_date)
            VALUES (?, ?, NULL, CURDATE())`,
            [thesis_id, professor_id]
        );

        // Get the professor's full name and status of the invitation
        const [invitation] = await connection.promise().query(
            `SELECT p.professor_id, CONCAT(p.name, ' ', p.surname) AS full_name,
            tc.status, tc.invitation_date
            FROM thesis_committee tc
            JOIN professor p ON p.professor_id = tc.professor_id
            WHERE tc.id = ?`,
            [result.insertId]
        );

        res.json({ success: true, invitation: invitation[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ success: false, error: 'Έχει ήδη σταλεί αίτημα σε αυτόν τον καθηγητή.' });
        }
        console.error(err);
        res.status(500).json({ success: false, error: 'Σφάλμα βάσης δεδομένων.' });
    }
});

// Get all committee invitations for a specific thesis, so that the student can see which professors have been invited
router.get('/get-committee-invitations/:thesis_id', async (req, res) => {

    // Get the thesis_id from the request parameters
    const { thesis_id } = req.params;

    // Validate thesis_id
    if (!thesis_id) {
        return res.status(400).json({ success: false, error: 'Λείπει το thesis_id.' });
    }

    // Fetch committee invitations from the database
    try {
        const [rows] = await connection.promise().query(
            `SELECT p.professor_id, CONCAT(p.name, ' ', p.surname) AS full_name,
            tc.status, tc.invitation_date
            FROM thesis_committee tc
            JOIN professor p ON p.professor_id = tc.professor_id
            WHERE tc.thesis_id = ?`,
            [thesis_id]
        );
        res.json({ success: true, invitations: rows });
    } catch (err) {
        console.error('Σφάλμα:', err);
        res.status(500).json({ success: false, error: 'Σφάλμα λήψης προσκλήσεων' });
    }
});

module.exports = router;
