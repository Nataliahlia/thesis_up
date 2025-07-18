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
      t.title AS thesis_title,
      p.name AS instructor_name,
      p.surname AS instructor_surname,
      s.name AS student_name,
      s.surname AS student_surname,
      CONCAT(p.name, ' ', p.surname) AS instructor_full_name,
      CONCAT(s.name, ' ', s.surname) AS student_full_name
    FROM announcements a
    JOIN thesis_topic t ON a.thesis_id = t.thesis_id
    JOIN professor p ON t.instructor_id = p.professor_id
    JOIN student s ON t.student_id = s.student_number
    WHERE t.state = 'Υπό Εξέταση'
  `;

  // Add date filtering if provided
  if (start && end) {
    sql += ` AND DATE(a.date) BETWEEN '${start}' AND '${end}'`;

  }

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching theses:', err);
      return res.status(500).json({ error: 'Failed to retrieve theses' });
    }
    console.log(results);
    res.json(results);
    });
  });

module.exports = router;
