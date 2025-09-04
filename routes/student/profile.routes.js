const express = require('express');
const router = express.Router();
const connection = require('../../db');

// ---------------------------------------------------------------------------------- //
// This file contains the routers that are related to the editing of a student's profile

// This is the router that is used to get the information of a student and we can then display it to him so that he/she can edit it
router.get('/myprofile-edit', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Fetch student information from the database
  const studentId = req.session.user.id;
  const query = `
    SELECT 
        name, 
        surname, 
        email, 
        street AS street, 
        number AS streetNumber,
        postcode AS postalCode, 
        city, 
        mobile_telephone AS mobileTelephone, 
        landline_telephone AS landlineTelephone
    FROM student
    WHERE student_number = ?`;

  connection.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results[0]); // Send the student info to the frontend
  });
});

// This is the router that is used after a student has finished editing his/hers profile
// and handles the form submission and the db update
router.post('/myprofile-edit', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const studentId = req.session.user.id;

    // Extract the fields from the request body, they can be undefined if not provided
    const {
        email,
        street,
        streetNumber,
        postalCode,
        city,
        mobileTelephone,
        landlineTelephone
    } = req.body;

    // This retrieves the current values from the database to ensure we don't overwrite them with undefined values
    const selectQuery = `
        SELECT email, street, number, postcode, city, mobile_telephone, landline_telephone
        FROM student WHERE student_number = ?
    `;

    connection.query(selectQuery, [studentId], (err, results) => {
    if (err || results.length === 0) {
        console.error('Fetch error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch student data' });
    }

    const current = results[0];

    // Use either the new value or the current one, this prevents overwriting with undefined
    const updateQuery = `
        UPDATE student
        SET 
        email = ?, 
        street = ?, 
        number = ?, 
        postcode = ?, 
        city = ?, 
        mobile_telephone = ?, 
        landline_telephone = ?
        WHERE student_number = ?
    `;

    const values = [
        email || current.email,
        street || current.street,
        streetNumber || current.number,
        postalCode || current.postcode,
        city || current.city,
        mobileTelephone || current.mobile_telephone,
        landlineTelephone || current.landline_telephone,
        studentId
    ];

    console.log('VALUES TO UPDATE:', values);

    connection.query(updateQuery, values, (err, updateResult) => {
        if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ success: false, error: 'Failed to update profile' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    });

    // If the update is for email, update the users table as well
    if (email && email !== current.email) {
        console.log('Updating user email in users table');
        console.log('Email', email);
        console.log('Current email', current.email);

        const updateUserQuery = `
            UPDATE users 
            SET email = ? 
            WHERE id = ?
        `;

        connection.query(updateUserQuery, [email || current.email, studentId], (err) => {
            if (err) {
                console.error('User update error:', err);
                return res.status(500).json({ success: false, error: 'Failed to update user email' });
            }
        });
    }

  });
});

module.exports = router;