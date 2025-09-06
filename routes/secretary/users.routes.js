const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../../db'); // Import the database connection
const path = require('path'); // Import the path module to handle file paths
const multer = require('multer'); // Import multer for handling file uploads
const saltRounds = 10; // Number of rounds for bcrypt hashing, the higher the number the more secure but also slower
const fs = require('fs'); // Import fs for file system operations, used to read the uploaded file

// --------------------------------------------------------------------------------------------------- //
// This file handles the users upload from the secretary, the files are stored in the uploads destination

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

        // Variables used to store skipped users, used for the error message 
        let skippedStudents = [];
        let skippedProfessors = [];

        // Variables used to store successfully added users
        let successfulStudents = [];
        let successfulProfessors = [];

        try {
            const parsed = JSON.parse(jsonData); // Parse the JSON data from the file
            
            // Check if the parsed data is empty
            if (!parsed || Object.keys(parsed).length === 0) {
                return res.status(400).json({
                    error: 'Το αρχείο JSON είναι άδειο ή δεν περιέχει δεδομένα.'
                });
            }

            // Check if there are students or professors in the JSON
            if (!parsed.student && !parsed.professor) {
                return res.status(400).json({
                    error: 'Το αρχείο JSON δεν περιέχει στοιχεία φοιτητών ή καθηγητών. Παρακαλώ ελέγξτε τη δομή του αρχείου.'
                });
            }
            
            // Check if both students and professors are empty arrays
            const studentsEmpty = !parsed.student || (Array.isArray(parsed.student) && parsed.student.length === 0);
            const professorsEmpty = !parsed.professor || (Array.isArray(parsed.professor) && parsed.professor.length === 0);
            
            if (studentsEmpty && professorsEmpty) {
                return res.status(400).json({
                    error: 'Το αρχείο JSON περιέχει άδειες λίστες φοιτητών και καθηγητών.'
                });
            }
            
            // Wrap single student object into array - to handle both single and multiple student uploads
            if (parsed.student && !Array.isArray(parsed.student)) {
                parsed.student = [parsed.student];
            } 
            if (parsed.professor && !Array.isArray(parsed.professor)) {
                parsed.professor = [parsed.professor];
            }
            // Checks is it an array
            if (Array.isArray(parsed.student)) {
                console.log('Processing students:', parsed.student.length);
                // Process each user in the array
                for (const student of parsed.student) {
                    // process the student data
                    console.log('Processing student:', student);
                    const { student_number, emaiσl, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone } = student;
                    // Check if all required fields are present, if not error
                    if (!student_number || !email || !name || !surname) {
                        console.error('Missing required fields for user:', student);
                        skippedStudents.push(student);
                        continue;
                    }

                    // Auto-generate password
                    const rawPassword = `stud${student_number}@2025`; 
                    // Hash the password using bcrypt
                    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds); // Hash the password using bcrypt
                    // Insert the student into the database
                    const sql = `INSERT INTO student (student_number, email, password_hash, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    console.log('Student:', student_number, email, name, surname);
                    // Wait until the query is done
                    try {
                        await connection.promise().query(sql, [student_number, email, hashedPassword, name, surname, street ?? null, number ?? null, city ?? null, postcode ?? null, father_name, landline_telephone ?? null, mobile_telephone ?? null]);
                        console.log('Inserted student:', student_number, email, name, surname);
                        // Increment the addedStudents counter
                        addedStudents++;
                        // Add to successful students
                        successfulStudents.push(student);
                    } catch (dbError) {
                        if (dbError.code === 'ER_DUP_ENTRY') {
                            console.log('Duplicate student found:', student.student_number, student.email);

                            // Add to the non inserted students
                            skippedStudents.push(student);
                            continue; // Continue to next student instead of returning
                        } else {
                            console.error('Database error for student:', student, dbError);
                            throw dbError; // Let other errors bubble up
                        }
                    }
                }
            } 
            if (Array.isArray(parsed.professor)) {
                // Process each user in the array
                for (const professor of parsed.professor) {
                    // process the professor data
                    const { email, name, surname, topic, department, university, landline, mobile } = professor;
                    // Check if all required fields are present, if not error
                    if (!email || !name || !surname) {
                        skippedProfessors.push(professor);
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
                    try {
                        await connection.promise().query(sql, [email, hashedPassword, name, surname, topic, department, university, landline, mobile]);
        
                        // Increment the addedProfessors counter
                        addedProfessors++;
                        // Add to successful professors
                        successfulProfessors.push(professor);
                    } catch (dbError) {
                        if (dbError.code === 'ER_DUP_ENTRY') {
                            console.log('Duplicate professor found:', professor.email);
                            // Add to the non inserted professors
                            skippedProfessors.push(professor);
                            continue; // Continue to next professor instead of returning
                        } else {
                            console.error('Database error for professor:', professor, dbError);
                            throw dbError; // Let other errors bubble up
                        }
                    }
                }
            }

            // Final check: If no users were added and all were skipped
            if (addedStudents === 0 && addedProfessors === 0) {
                const totalSkipped = skippedStudents.length + skippedProfessors.length;
                if (totalSkipped > 0) {
                    return res.status(400).json({ 
                        error: `Δεν προστέθηκε κανένας χρήστης. Όλοι οι ${totalSkipped} χρήστες παραλείφθηκαν λόγω προβλημάτων (διπλότυπα ή ελλιπή στοιχεία).`,
                        duplicateStudents: skippedStudents,
                        duplicateProfessors: skippedProfessors
                    });
                } else {
                    return res.status(400).json({ 
                        error: 'Δεν προστέθηκε κανένας χρήστης. Ελέγξτε ότι τα δεδομένα που εισάγονται είναι σωστά.' 
                    });
                }
            }
            
            // Send a response back to the client that contains the number of added students and professors
            res.status(200).json({
                addedStudents,
                addedProfessors,
                success: true,
                message: 'Users processed',
                students: successfulStudents,
                professors: successfulProfessors,
                duplicateStudents: skippedStudents,
                duplicateProfessors: skippedProfessors
            });
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

module.exports = router; // Export the router to be used in server.js