const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router(); // Create a new router instance, to handle routes related to authentication
const connection = require('../db'); // Import the database connection
const path = require('path'); // Import the path module to handle file paths

// Serve the login page at /login, when someone accesses the /login URL send them the login.html file
router.get('/login', (req, res) => {
    console.log('Attempting to serve login.html');
    res.sendFile(path.join(__dirname, '..', 'thesis_up', 'pages', 'login.html'));
});

// Handle login form submission, when the server receives a POST request to /login, it will execute the following function
router.post('/login', (req, res) => {
    console.log('Login attempt with username:', req.body.username);
    console.log('Request body:', req.body);
    const { username, password } = req.body;

    // Handle the authentication check
    const query = 'SELECT * FROM users WHERE email = ?';
    console.log('Executing query:', query, 'with username:', username);

    // Use async because the bcrypt compare function is asynchronous
    connection.query(query, [username], async (err, results) => {
        // Handle any errors that occur during the query
        if (err)  {
            console.log('Database query error:', err);
            // If there is a db error return error
            return res.status(500).send('Database query error');
        } 
        
        console.log('Query results length:', results.length);
        if (results.length > 0) {
            console.log('Found user:', results[0].email, 'Role:', results[0].role);
        }
        
        if (results.length === 0) {
            console.log('No user found with email:', username);
            // If no user found, redirect to login with error
            return res.status(401).json({ error: 'Λάθος όνομα χρήστη ή κωδικός πρόσβασης' });
        }

        // results[0] contains the users id 
        const user = results[0];    
        if (results.length > 0) {
            // Compare the provided password with the stored hash, await is used because the bcrypt compare function is asynchronous
            try {
                console.log('Comparing password for user:', user.email);
                console.log('Stored password hash:', user.password_hash);
                console.log('Provided password:', password);
                const isMatch = await bcrypt.compare(password, user.password_hash);
                console.log('Password match result:', isMatch);

                if (!isMatch) {
                    console.log('Password mismatch for user:', user.email);
                    // If password does not match, redirect to login with error
                    return res.status(401).json({ error: 'Λάθος όνομα χρήστη ή κωδικός πρόσβασης' });
                } else {
                    console.log('Password matched, creating session for user:', user.email);
                    // First, create a `user` object inside the session if it doesn't exist
                    req.session.user = {
                        user_id: user.user_id, 
                        id: user.id, 
                        name: user.name,
                        surname: user.surname,
                        role: user.role
                    };

                    console.log('User session:', req.session.user);
                    // Redirect to dashboard if login successful
                    if (user.role == 'secretary') {
                        return res.status(200).send('/pages/dashboardSecretary');
                    } else if (user.role == 'professor') {
                        return res.status(200).send('/pages/dashboardProfessor');
                    } else if (user.role == 'student') {
                        return res.status(200).send('/pages/dashboardStudent');
                    }
                }
            } catch (error) {
                console.log('Error during password comparison:', error);
                // Handles errors that occur because of await
                return res.status(500).send('Error comparing passwords');
            }   
        }
   });
});

module.exports = router;