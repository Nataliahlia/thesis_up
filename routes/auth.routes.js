const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection
const path = require('path'); // Import the path module to handle file paths

// Serve the login page at /login, when someone accesses the /login URL send them the public_endpoint.html file
router.get('/login', (req, res) => {
    console.log('Attempting to serve login.html');
    res.sendFile(path.join(__dirname, '..', 'thesis_up', 'login.html'));
});

// Handle login form submission, when the server receives a POST request to /login, it will execute the following function
router.post('/login', (req, res) => {
    console.log('Login attempt with username:', req.body.username);
    const { username, password } = req.body;

    // Handle the authentication check
    const query = 'SELECT * FROM users WHERE email = ?';

    // Use async because the bcrypt compare function is asynchronous
    connection.query(query, [username], async (err, results) => {
        // Handle any errors that occur during the query
        if (err)  {
            // If there is a db error return error
            console.error('Database query error:', err);
            return res.status(500).send('Database query error');
        } 
        
        if (results.length === 0) {
            // If no user found, redirect to login with error
            console.log('No user found with the provided email.');
            return res.redirect('/login.html?error=1');
        }

        // results[0] contains the users id 
        const user = results[0];    
        if (results.length > 0) {
            // Compare the provided password with the stored hash, await is used because the bcrypt compare function is asynchronous
            try {
                const isMatch = await bcrypt.compare(password, user.password_hash);

                if (!isMatch) {
                    // If password does not match, redirect to login with error
                    return res.redirect('/login.html?error=1');
                } else {
                    if (user.role == 'secretary') {
                        // Redirect to dashboard if login successful
                        res.redirect('/dashboards/dashboardSecretary');
                    } else if (user.role == 'professor') {
                        res.redirect('/dashboards/dashboardProfessor');
                    } else if (user.role == 'student') {
                        res.redirect('/dashboards/dashboardStudent');
                    }
                }
            } catch (error) {
                // Handles errors that occur because of await
                console.error('Error comparing passwords:', error);
                return res.status(500).send('Error comparing passwords');
            }   
        }
   });
});

module.exports = router;