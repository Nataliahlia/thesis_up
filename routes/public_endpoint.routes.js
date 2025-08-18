// routes/announcements.routes.js
const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/api/announcements', (req, res) => {
  const { start, end } = req.query;

  let sql = `
    SELECT 
      a.id, 
      a.thesis_id, 
      a.date, 
      a.time, 
      a.type, 
      a.location_or_link,
      COALESCE(t.title, CONCAT('Διπλωματική Εργασία #', a.thesis_id)) AS thesis_title,
      COALESCE(CONCAT(p.name, ' ', p.surname), 'Καθηγητής') AS instructor_full_name,
      COALESCE(CONCAT(s.name, ' ', s.surname), 'Φοιτητής') AS student_full_name
    FROM announcements a
    LEFT JOIN thesis_topic t ON a.thesis_id = t.thesis_id
    LEFT JOIN professor p ON t.instructor_id = p.professor_id
    LEFT JOIN student s ON t.student_id = s.student_number
  `;

  // Add date filtering if provided
  if (start && end) {
    sql += ` WHERE DATE(a.date) BETWEEN '${start}' AND '${end}'`;
  }

  sql += ` ORDER BY a.date, a.time`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching announcements:', err);
      return res.status(500).json({ error: 'Failed to retrieve announcements' });
    }
    console.log('Announcements found:', results.length);
    res.json(results);
    });
  });

module.exports = router;
