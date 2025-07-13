const express = require('express');
const router = express.Router();

// After a user logs in, this route will return the session information
router.get('/session-info', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({
    name: req.session.user.name,
    surname: req.session.user.surname,
    user_id: req.session.user.user_id
  });
});

module.exports = router;
