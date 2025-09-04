const express = require('express');
const router = express.Router();

// Mount feature routers (each must export an Express router)
router.use(require('./theses.routes'));     // thesis topic handling from the secretary
router.use(require('./users.routes'));      // secretary uploads users

module.exports = router;