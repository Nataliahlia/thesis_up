const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse form data, this middleware reads the body and turns it into a JavaScript object accessible via req.body
app.use(express.urlencoded({ extended: true }));

// Serve static files, tells Express to serve static files from the current directory
app.use(express.static(path.join(__dirname, 'thesis_up')));

// Serve the login page at root URL, when someone accesses the root URL send them the public_endpoint.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'thesis_up', 'index.html'));
});

// Serve the login page at /login, when someone accesses the /login URL send them the public_endpoint.html file
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'thesis_up', 'login.html'));
});

// Handle login form submission, when the server receives a POST request to /login, it will execute the following function
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Handle the authentication check
  if (username === 'admin' && password === '1234') {
    // Redirect to dashboard if login successful
    res.redirect('/dashboard');
  } else {
    //  Show an error message if login fails
    res.redirect('/login.html?error=1');
  }
});

// If login is successful, redirect to the dashboard page, by sending a GET request to /dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'thesis_up', 'dashboard.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
