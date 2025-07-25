const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/mythesis-details', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const studentId = req.session.user.id;
  const query = `
    SELECT 
        tt.thesis_id,
        tt.title, 
        tt.description, 
        tt.pdf, 
        tt.state,
        tt.draft_file,
        tt.additional_links,
        tt.member1,
        tt.member2,
        tt.instructor_id,
        tt.nimertis_link,
        DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
        instructor.name as instructor_name,
        instructor.surname as instructor_surname,
        m1.name as mentor_name,
        m1.surname as mentor_surname,
        m2.name as mentortwo_name,
        m2.surname as mentortwo_surname,
        CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
        CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name,
        CONCAT(instructor.name, ' ', instructor.surname) as full_instructor_name
    FROM thesis_topic tt
    LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
    LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
    LEFT JOIN professor instructor ON tt.instructor_id = instructor.professor_id
    WHERE student_id = ?`;

  connection.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results); // Send the thesis info to the frontend
  });
});


module.exports = router;