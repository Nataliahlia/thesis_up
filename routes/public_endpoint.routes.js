// routes/announcements.routes.js
const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/api/announcements', (req, res) => {
    console.log('Fetching announcements');
    const sql = `SELECT id, thesis_id, title, date, time, type, location_or_link FROM announcements`;
    connection.query(sql, (err, results) => {
    if (err) {
        console.error('Error fetching theses:', err);
        return res.status(500).json({ error: 'Failed to retrieve theses' });
    }
    res.json(results);
  });
});

module.exports = router;
