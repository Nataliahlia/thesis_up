const express = require('express');
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection

router.get('/thesis-topics', (req, res) => {
    console.log('Serving thesis topics page');

    // SQL query to fetch all thesis topics
    const query = 'SELECT * FROM thesis_topic WHERE state="Ενεργή" OR state="Υπό Εξέταση"';

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Σφάλμα κατά την ανάκτηση των δεδομένων:', error);
            res.status(500).send('Σφάλμα κατά την ανάκτηση των δεδομένων');
        } else {
            res.json(results);
        }
    });
});

module.exports = router;