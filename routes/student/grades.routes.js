const express = require('express');
const router = express.Router();
const connection = require('../../db');

// -------------------------------------------------------------------------------------------------------- //
// This file handles the retrieval of thesis grades for a specific student, so that we can update thesis topic

router.get('/get-grades/:thesis_id', async (req, res) => {
    console.log('Serving thesis topics page');

    // Get thesisId from query or body (adjust as needed)
    const thesisId = req.params.thesis_id;
    if (!thesisId) {
        return res.status(400).json({ error: 'Missing thesisId parameter.' });
    }

    // SQL query to fetch the grades from the three committee members
    const query = `
        SELECT 
            tc.thesis_id,
            tc.professor_id,
            tc.grade,
            p.name AS professor_name,
            p.surname AS professor_surname,
            CONCAT(p.name, ' ', p.surname) AS professor_full_name,
            CASE 
                WHEN tt.instructor_id = tc.professor_id THEN 'Instructor'
                ELSE 'Member'
            END AS member_role
        FROM thesis_comments tc
        JOIN professor p ON tc.professor_id = p.professor_id
        JOIN thesis_topic tt ON tc.thesis_id = tt.thesis_id
        WHERE tc.thesis_id = ?;
    `;

    try {
        const [rows] = await connection.promise().query(query, [thesisId]);
        const grades = rows.map(r => parseFloat(r.grade)).filter(g => !isNaN(g));

        console.log('Grades fetched:', grades);
        if (grades.length === 3) {
            const average = grades.reduce((sum, g) => sum + g, 0) / 3;
            await connection.promise().query(
                'UPDATE thesis_topic SET final_grade = ? WHERE thesis_id = ?',
                [average.toFixed(2), thesisId]
            );
        }
        // Return success
        return res.json({ success: true, grades: rows });
    } catch (err) {
        console.error('Error fetching grades:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;