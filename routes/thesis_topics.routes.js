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
            tt.instructor_id,
            tt.member1,
            tt.member2,
            tt.protocol_number,
            tt.nimertis_link,
            tt.final_grade,
            DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
            s.name as name,
            s.surname as surname,
            s.father_name as father_name,
            s.mobile_telephone as mobile_telephone,
            s.landline_telephone as landline_telephone,
            s.email as student_email,
            instructor.name as instructor_name,
            instructor.surname as instructor_surname,
            m1.name as mentor_name,
            m1.surname as mentor_surname,
            m2.name as mentortwo_name,
            m2.surname as mentortwo_surname,
            CONCAT(s.name, ' ', s.surname) as full_student_name,
            CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
            CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name,
            CONCAT(instructor.name, ' ', instructor.surname) as full_instructor_name
        FROM thesis_topic tt
        LEFT JOIN student s ON tt.student_id = s.student_number
        LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
        LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
        LEFT JOIN professor instructor ON tt.instructor_id = instructor.professor_id
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