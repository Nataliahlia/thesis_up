const express = require('express');
const router = express.Router();
const connection = require('../db');

router.post('/finalize-thesis', (req, res) => {
    const thesis_id = req.body.thesis_id;
    // Validate thesis_id
    if (!thesis_id) {
        return res.status(400).json({ success: false, error: 'Missing thesis_id parameter.' });
    }

    // This is used to get the secretary's name from the session
    const fullSecretaryName = `${req.session.user.name} ${req.session.user.surname}`;
    if (!fullSecretaryName) {
        return res.status(403).json({ success: false, error: 'Μη εξουσιοδοτημένη πρόσβαση' });
    }
    // SQL query to update the thesis state in thesis_topic
    const query = 'UPDATE thesis_topic SET state = ? WHERE thesis_id = ?';

    // First, update the thesis
    connection.query(query, ['Περατωμένη', thesis_id], (error, results) => {
        if (error) {
            console.error('Σφάλμα βάσης:', error);
            return res.status(500).json({ success: false, error: 'Σφάλμα βάσης.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Δεν βρέθηκε η διπλωματική.' });
        }

        // SQL query to insert into the thesis events
        const query_two = `
            INSERT INTO thesis_events (thesis_id, status, created_by)
            VALUES (?, 'Περατωμένη', ?)
        `;

        // Execute the insert query into thesis_events
        connection.query(query_two, [thesis_id, fullSecretaryName], (error_two, results_two) => {
            if (error_two) {
                console.error('Σφάλμα βάσης (thesis_events):', error_two);
                return res.status(500).json({ success: false, error: 'Σφάλμα βάσης κατά την εισαγωγή στο ιστορικό.' });
            }
            if (results_two.affectedRows === 0) {
                return res.status(500).json({ success: false, error: 'Σφάλμα κατά την εισαγωγή στο ιστορικό διπλωματικής.' });
            }
            res.json({ success: true });
        });
    });
});

module.exports = router;