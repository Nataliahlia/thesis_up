const express = require('express');
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection

router.get('/get-thesis-events/:thesis_id', async (req, res) => {
    const thesisId = req.params.thesis_id;

    // Validate the thesisId parameter
    if (!thesisId) {
        return res.status(400).json({ error: 'Thesis ID is required' });
    }   

    try {

        // Query the database for thesis events related to the given thesis ID
        const [rows] = await connection.promise().query(`
            SELECT event_date, status
            FROM thesis_events
            WHERE thesis_id = ?
            ORDER BY event_date ASC
        `, [thesisId]);

        res.json({ events: rows });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
