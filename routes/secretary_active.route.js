const express = require('express');
const router = express.Router();
const connection = require('../db');

// Route to submit the protocol number
router.post('/submit-protocol-number', (req, res) => {
    // Get thesis_id and protocol_number from request body
    const { thesis_id, protocol_number } = req.body;

    // Validate input
    if (!thesis_id || !protocol_number) {
        return res.status(400).json({ success: false, error: 'Λείπουν δεδομένα.' });
    }

    // SQL query to update the protocol number for the given thesis_id
    const query = 'UPDATE thesis_topic SET protocol_number = ? WHERE thesis_id = ?';

    // Execute the query
    connection.query(query, [protocol_number, thesis_id], (error, results) => {
        console.log('Αποτέλεσμα βάσης:', results);
        if (error) {
            console.error('Σφάλμα βάσης:', error);
            return res.status(500).json({ success: false, error: 'Σφάλμα βάσης.' });
        }

        // Check if any row was affected
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Δεν βρέθηκε η διπλωματική.' });
        }

        res.json({ success: true });
    });
});

// Router to delete the thesis from the thesis_topic table and insert it in canceled_thesis
router.post('/delete-thesis/:thesis_id', (req, res) => {
    // Get the thesis id
    const { thesis_id } = req.params;

    if (!thesis_id) {
        return res.status(400).json({ success: false, error: 'Λείπει το ID της διπλωματικής.' });
    }

    // SQL query to delete the thesis from thesis_topic
    const query = 'DELETE FROM thesis_topic WHERE thesis_id = ?';

    // Get cancelled_at and reason from request body
    const { reason, assembly_number, assembly_year } = req.body;

    // This is used to get the secretary's name from the session
    const fullSecretaryName = `${req.session.user.name} ${req.session.user.surname}`;
    if (!fullSecretaryName) {
        return res.status(403).json({ success: false, error: 'Μη εξουσιοδοτημένη πρόσβαση' });
    }

    // First, delete the thesis
    connection.query(query, [thesis_id], (error, results) => {
        if (error) {
            console.error('Σφάλμα βάσης:', error);
            return res.status(500).json({ success: false, error: 'Σφάλμα βάσης.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Δεν βρέθηκε η διπλωματική.' });
        }

        // Then, insert into canceled_thesis
        const query_two = `
            INSERT INTO canceled_thesis 
            (id, reason, assembly_number, assembly_year) 
            VALUES (?, ?, ?, ?)
        `;

        // Execute the insert query into canceled_thesis
        connection.query(query_two, [thesis_id, reason, assembly_number, assembly_year], (error2, results2) => {
            if (error2) {
                console.error('Σφάλμα βάσης (canceled_thesis):', error2);
                return res.status(500).json({ success: false, error: 'Σφάλμα βάσης κατά την ακύρωση.' });
            }
            if (results2.affectedRows === 0) {
                return res.status(500).json({ success: false, error: 'Σφάλμα κατά την εισαγωγή στην ακυρωμένη διπλωματική.' });
            }
        });

        // Insert into thesis_events
        const query_three = `
            INSERT INTO thesis_events (thesis_id, status, created_by)
            VALUES (?, 'Ακυρωμένη', ?)
        `;

        // Execute the insert query into thesis_events
        connection.query(query_three, [thesis_id, fullSecretaryName], (error3, results3) => {
            if (error3) {
                console.error('Σφάλμα βάσης (thesis_events):', error3);
                return res.status(500).json({ success: false, error: 'Σφάλμα βάσης κατά την εισαγωγή στο ιστορικό.' });
            }
            if (results3.affectedRows === 0) {
                return res.status(500).json({ success: false, error: 'Σφάλμα κατά την εισαγωγή στο ιστορικό διπλωματικής.' });
            }
            res.json({ success: true });
        });
    });
});

module.exports = router;
