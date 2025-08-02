const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');

// Middleware to parse form data, this middleware reads the body and turns it into a JavaScript object accessible via req.body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files, tells Express to serve static files from the current directory
app.use(express.static(path.join(__dirname, 'thesis_up')));
app.use('/uploads/thesis-pdfs', express.static(path.join(__dirname, 'uploads/thesis-pdfs')));
app.use(session({
  secret: 'secret-key',       // This should be a strong secret key - given it a simple value for now
  resave: false,              // This option prevents resaving the session if it hasn't changed
  saveUninitialized: false,   // This keeps the session from being saved if it is new but not modified
  cookie: {                   // The cookie settings
    secure: false,            // true only if HTTPS
    maxAge: 1000 * 60 * 60    // 1 hour
  }
}));

app.use(require('./routes/auth.routes'));
app.use(require('./routes/dashboard.routes'));  
app.use(require('./routes/public_endpoint.routes'));
app.use(require('./routes/upload_users.routes'));
app.use(require('./routes/thesis_topics.routes'));
app.use(require('./routes/mythesis_details.routes'));
app.use(require('./routes/session.routes'));
app.use(require('./routes/myprofile_edit.route'));
app.use(require('./routes/under_examination_update.route'));
app.use(require('./routes/student_examination.route'));
app.use(require('./routes/notes.routes')); // UC13 Notes routes
app.use(require('./routes/secretary_active.route')); 
app.use(require('./routes/thesis_completion.routes'));
const { router: protocolRouter } = require('./routes/protocol.route');
app.use(protocolRouter);
app.use(require('./routes/protocol_pdf.route'));
app.use(require('./routes/nimertis.route')); 
app.use(require('./routes/thesis_events.route')); // Thesis events routes
app.use(require('./routes/all_profs.route')); // All professors route

const updatePasswords = require('./scripts/updatePasswords');

updatePasswords((err, count) => {
  if (err) {
    console.error('Error updating passwords:', err);
  } else {
    console.log(`Passwords updated for ${count} secretaries.`);
  }
});

// Add thesis details routes separately
try {
    app.use(require('./routes/thesis_details.routes'));
    console.log('Thesis details routes loaded successfully');
} catch (error) {
    console.error('Error loading thesis details routes:', error.message);
}

// Add professor routes with error handling
try {
    app.use(require('./routes/professor.routes'));
    console.log('Professor routes loaded successfully');
} catch (error) {
    console.error('Error loading professor routes:', error.message);
}

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