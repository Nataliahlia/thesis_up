const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');

// Middleware to parse form data, this middleware reads the body and turns it into a JavaScript object accessible via req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cache Control Middleware για διαφορετικούς τύπους αρχείων
app.use((req, res, next) => {
  const url = req.url;
  
  // Για στατικά assets (CSS, JS, εικόνες) - μακροχρόνια cache
  if (url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Cache για 30 ημέρες (2592000 seconds)
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }
  // Για HTML αρχεία - μικρή cache με validation
  else if (url.match(/\.html$/)) {
    // Cache για 5 λεπτά με must-revalidate
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  }
  // Για dashboard σελίδες - no cache (πάντα fresh)
  else if (url.includes('/dashboard')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Για API endpoints - no cache
  else if (url.startsWith('/api/') || url.startsWith('/auth/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Default για άλλα αρχεία - μικρή cache
  else {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 ώρα
  }
  
  next();
});

// Serve static files, tells Express to serve static files from the current directory
app.use(express.static(path.join(__dirname, 'thesis_up')));
app.use('/uploads/thesis-pdfs', express.static(path.join(__dirname, 'uploads/thesis-pdfs')));

// Favicon route
app.get('/favicon.ico', (req, res) => {
  // Cache favicon για 7 ημέρες
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'thesis_up', 'loggo.png'));
});

app.use(session({
  secret: 'secret-key',       // This should be a strong secret key - given it a simple value for now
  resave: false,              // This option prevents resaving the session if it hasn't changed
  saveUninitialized: false,   // This keeps the session from being saved if it is new but not modified
  cookie: {                   // The cookie settings
    secure: false,            // true only if HTTPS
    maxAge: 1000 * 60 * 60    // 1 hour
  }
}));

// Middleware to check if the user is authenticated, so he can not access the dashboard without being logged in
function isAuthenticated(req, res, next) {
  // Check if the session exists and if the user is logged in
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  // Check if the user has the correct role for the requested dashboard, so different users can not access different dashboards
  // Get the user's role and the requested URL
  const role = req.session.user.role;
  const url = req.originalUrl;

  // Check the role and redirect accordingly
  if (role === 'student' && url.includes('dashboardStudent')) {
    return next();
  }
  
  if (role === 'professor' && url.includes('dashboardProfessor')) {
    return next();
  }

  if (role === 'secretary' && url.includes('dashboardSecretary')) {
    return next();
  }

  // If the user does not have the correct role for the requested dashboard, redirect to the login page
  return res.redirect('/login');
}

// Προστασία φακέλου dashboards
app.use('/dashboards', isAuthenticated, express.static(path.join(__dirname, 'dashboards')));

app.use(require('./routes/auth.routes'));
app.use(require('./routes/dashboard.routes'));  
app.use(require('./routes/public_endpoint.routes'));
app.use(require('./routes/session.routes'));
app.use(require('./routes/notes.routes')); // UC13 Notes routes
app.use(require('./routes/logout.route')); // Logout route
app.use(require('./routes/thesis_grading.routes')); // UC3 Thesis routes

// The routes that are used for secretary
const secretaryRoutes = require('./routes/secretary/index.routes');
app.use(secretaryRoutes);

// The routes that are used for student
const studentRoutes = require('./routes/student/index.routes');
app.use(studentRoutes);

const updatePasswords = require('./scripts/updatePasswords');

updatePasswords((err, count) => {
  if (err) {
    console.error('Error updating passwords:', err);
  } else {
    console.log(`Passwords updated for ${count} secretaries.`);
  }
});

// Add professor routes with error handling
try {
    app.use(require('./routes/professor.routes'));
    console.log('Professor routes loaded successfully');
} catch (error) {
    console.error('Error loading professor routes:', error.message);
}

// Add the committee routes
const committeeRoutes = require('./routes/committee.routes');
app.use('/', committeeRoutes);

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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});