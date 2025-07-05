const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const app = express();
const saltRounds = 10; // Number of rounds for bcrypt hashing

// Middleware to parse form data, this middleware reads the body and turns it into a JavaScript object accessible via req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files, tells Express to serve static files from the current directory
app.use(express.static(path.join(__dirname, 'thesis_up')));

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'natalia',
  database: 'web_db',
  charset: 'utf8mb4'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Serve the login page at root URL, when someone accesses the root URL send them the public_endpoint.html file
app.get('/', (req, res) => {
  console.log('Attempting to serve index.html');
  res.sendFile(path.join(__dirname, 'thesis_up', 'index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading page');
    } else {
      console.log('File sent successfully');
    }
  });
});

app.get('/api/announcements', (req, res) => {
  console.log('Fetching announcements');
  const sql = `SELECT id, thesis_id, title, date, time, type, location_or_link FROM announcements`;
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching theses:', err);
      return res.status(500).json({ error: 'Failed to retrieve theses' });
    }
    res.json(results);
  });
});

// Serve the login page at /login, when someone accesses the /login URL send them the public_endpoint.html file
app.get('/login', (req, res) => {
  console.log('Attempting to serve login.html');
  res.sendFile(path.join(__dirname, 'thesis_up', 'login.html'));
});

// Handle login form submission, when the server receives a POST request to /login, it will execute the following function
app.post('/login', (req, res) => {
  console.log('Login attempt with username:', req.body.username);
  const { username, password } = req.body;

  // Handle the authentication check

  const query = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';

  connection.query(query, [username, password], (err, results) => {
    // Handle any errors that occur during the query
    if (err) {
      console.error('Database query error:', err);
      return res.redirect('/login.html?error=1');
    }

    // Check if user exists
    if (results.length > 0) {
      if (results[0].role == 'secretary') {
        // Redirect to dashboard if login successful
        res.redirect('/dashboards/dashboardSecretary');
      } else if (results[0].role == 'professor') {
        res.redirect('/dashboards/dashboardProfessor');
      } else if (results[0].role == 'student') {
        res.redirect('/dashboards/dashboardStudent');
      }
    } else {
      // Show an error message if login fails
      res.redirect('/login.html?error=1');
    }
  });
});

// If login is successful, redirect to the dashboard page, by sending a GET request to the correct dashboard
app.get('/dashboards/dashboardSecretary', (req, res) => {
  console.log('Serving dashboardSecretary.html');
  res.sendFile(path.join(__dirname, 'thesis_up', 'dashboards/dashboardSecretary.html'));
});


// If login is successful, redirect to the dashboard page, by sending a GET request to the correct dashboard
app.get('/dashboards/dashboardProfessor', (req, res) => {
  console.log('Serving dashboardProfessor.html');
  res.sendFile(path.join(__dirname, 'thesis_up', 'dashboards/dashboardProfessor.html'));
});

app.get('/dashboards/dashboardStudent', (req, res) => {
  console.log('Serving dashboardStudent.html');
  res.sendFile(path.join(__dirname, 'thesis_up', 'dashboards/dashboardStudent.html'));
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
