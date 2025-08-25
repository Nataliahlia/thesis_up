const express = require('express');
const router = express.Router();
const connection = require('../../db');

// Router to get the thesis topics details 
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

// Router to finalize the thesis (set state to 'Περατωμένη' (secretary does this manually) and insert into thesis_events)
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
