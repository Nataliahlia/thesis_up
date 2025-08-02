const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/logout', (req, res) => {
    // Destroy the session when logging out
    req.session.destroy(err => {
        if (err) {
            console.error('Σφάλμα κατά την αποσύνδεση:', err);
            return res.status(500).send('Σφάλμα αποσύνδεσης');
        }
        // Καθαρίζει το cookie του session
        res.clearCookie('connect.sid');
        // Ανακατευθύνει στη σελίδα login
        res.redirect('/login');
    });
});

module.exports = router;