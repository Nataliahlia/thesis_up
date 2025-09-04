const express = require('express');
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../../db'); // Import the database connection

// ------------------------------------------------------------------------------------------------------------------- //
// This is the router that we use so that we can get the events that have happened, its the chronological order of events
// and it is used for the Χρονολόγιο part in the thesis management section

router.get('/get-thesis-events/:thesis_id', async (req, res) => {
    const thesisId = req.params.thesis_id;

    // Validate the thesisId parameter
    if (!thesisId) {
        return res.status(400).json({ error: 'Thesis ID is required' });
    }   

    try {

        // Query the database for thesis events related to the given thesis ID
        const [rows] = await connection.promise().query(`
            SELECT 
                event_date, 
                status,
                LAG(status) OVER (ORDER BY event_date) AS previous_status
            FROM thesis_events
            WHERE thesis_id = ?
            ORDER BY event_date ASC
        `, [thesisId]);

        // Filter to only include records where status changed
        const stateChanges = rows.filter((row, index) => {
            if (index === 0) return true; // Always include first record
            return row.status !== row.previous_status; // Only include if status changed
        });

        res.json({ events: stateChanges });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
