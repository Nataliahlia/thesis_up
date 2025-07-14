const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection
const path = require('path'); // Import the path module to handle file paths
const multer = require('multer'); // Import multer for handling file uploads
const saltRounds = 10; // Number of rounds for bcrypt hashing, the higher the number the more secure but also slower
const fs = require('fs'); // Import fs for file system operations, used to read the uploaded file

// The post request contains a json file named userAddingFile, which contains the data of the user to be added
// First we need to read the file and then parse it to JSON
const upload = multer({ dest: 'uploads/' }); // Set the destination for uploaded files, when a file is uploaded it will be saved in the uploads folder

// Handle the file that was uploaded with the name userAddingFile
router.post('/upload-user', upload.single('userAddingFile'), async (req, res) => {
    // Now the file info is in req.file
    const filePath = req.file.path; // Path of the uploaded file, to read it later

    // fs is used to read the file
    fs.readFile(filePath, 'utf8', async (err, jsonData) => {
        // Error if reading the file fails
        if (err) return res.status(500).send('Error reading file');

        // Variables used to confirm the upload result
        let addedStudents = 0;
        let addedProfessors = 0;

        try {
            const parsed = JSON.parse(jsonData); // Parse the JSON data from the file
            // Wrap single student object into array - to handle both single and multiple student uploads
            if (parsed.student && !Array.isArray(parsed.student)) {
                parsed.student = [parsed.student];
            } else if (parsed.professor && !Array.isArray(parsed.professor)) {
                parsed.professor = [parsed.professor];
            }
            // Checks is it an array
            if (Array.isArray(parsed.student)) {
                console.log('Processing students:', parsed.student.length);
                // Process each user in the array
                for (const student of parsed.student) {
                    // Increment the addedStudents counter
                    addedStudents++;
                    // process the student data
                    console.log('Processing student:', student);
                    const { student_number, email, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone } = student;

                    // Check if all required fields are present, if not error
                    if (!student_number || !email || !name || !surname) {
                        console.error('Missing required fields for user:', student);
                        continue;
                    }

                    // Auto-generate password
                    const rawPassword = `stud${student_number}@2025`; 
                    // Hash the password using bcrypt
                    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds); // Hash the password using bcrypt
                    // Insert the student into the database
                    const sql = `INSERT INTO student (student_number, email, password_hash, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    console.log('Inserting student:', student_number, email, name, surname);
                    // Wait until the query is done
                    await connection.promise().query(sql, [student_number, email, hashedPassword, name, surname, street ?? null, number ?? null, city ?? null, postcode ?? null, father_name, landline_telephone ?? null, mobile_telephone ?? null]);
                }
            } 
            if (Array.isArray(parsed.professor)) {
                // Process each user in the array
                for (const professor of parsed.professor) {
                    // Increment the addedProfessors counter
                    addedProfessors++;
                    // process the professor data
                    const { email, name, surname, topic, department, university, landline, mobile } = professor;

                    // Check if all required fields are present, if not error
                    if (!email || !name || !surname) {
                        console.error('Missing required fields for user:', professor);
                        continue;
                    }

                    // Auto-generate password
                    const rawPassword = `prof_${email.split('@')[0]}@2025`;
                    // Hash the password using bcrypt
                    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds); // Hash the password using bcrypt
                    // Insert the professor into the database
                    const sql = `INSERT INTO professor (email, password_hash, name, surname, topic, department, university, landline, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    // Wait until the query is done
                    await connection.promise().query(sql, [email, hashedPassword, name, surname, topic, department, university, landline, mobile]);
                }
            }
            // Send a response back to the client
            res.status(200).json({addedStudents, addedProfessors, success: true, message: 'Users added successfully',   students: parsed.student || [], professors: parsed.professor || []});
        } catch (parseError) {
            // If there is an error parsing the JSON data, send an error response
            console.error('Error parsing JSON data:', parseError);
            res.status(400).json({error: 'Invalid JSON data in the uploaded file'});
        } finally {
            // Clean up the uploaded file after processing, prevents the server from filling up with old files
            fs.unlink(filePath, () => {}); 
        }
    });
});

// // To dynamically fetch the list of users from the database and display them on the dashboard
// router.get('/upload-user', async (req, res) => {
//     console.log('Fetching users from the database...');
//     try {
//         const [students] = await connection.promise().query(
//             'SELECT student_number, name, surname, email FROM student'
//         );
//         const [professors] = await connection.promise().query(
//             'SELECT professor_id, name, surname, email FROM professor'
//         );

//         // Ενοποίηση των 2 πινάκων σε έναν πίνακα χρηστών
//         const users = [
//             ...students.map(s => ({ ...s, professor_id: null })), // για να υπάρχει το πεδίο
//             ...professors.map(p => ({ ...p, student_number: null })) // για να υπάρχει το πεδίο
//         ];

//         res.json(users);
//     } catch (err) {
//         console.error('Σφάλμα βάσης:', err);
//         res.status(500).json({ error: 'Σφάλμα βάσης δεδομένων.' });
//     }
// });

module.exports = router; // Export the router to be used in server.js