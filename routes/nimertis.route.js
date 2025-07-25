const express = require('express');
const router = express.Router();
const connection = require('../db');

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