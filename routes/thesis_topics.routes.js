const express = require('express');
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection

router.get('/thesis-topics', (req, res) => {
    console.log('Serving thesis topics page');

    // SQL query to fetch all thesis topics
    const query = `
        SELECT 
            tt.thesis_id,
            tt.title,
            tt.description,
            tt.state,
            tt.student_id,
            s.name as name,
            s.surname as surname,
            CONCAT(s.name, ' ', s.surname) as full_student_name
        FROM thesis_topic tt
        LEFT JOIN student s ON tt.student_id = s.student_number
        WHERE tt.state = 'Ενεργή' OR tt.state = 'Υπό Εξέταση'
        ORDER BY tt.thesis_id ASC
    `;
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