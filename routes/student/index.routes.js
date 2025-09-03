const express = require('express');
const router = express.Router();

// Mount feature routers (each must export an Express router)
router.use(require('./profile.routes'));        // editing of a student's profile
router.use(require('./thesis_core.routes'));    // everything that is related to a specific thesis topic
router.use(require('./events.routes'));         // chronological order of events
router.use(require('./grades.routes'));         // retrieval of thesis grades
router.use(require('./files.routes'));          // protocol and pdf
router.use(require('./committee.routes'));      // student chooses the thesis committee members
router.use(require('./announcements.routes'));  // insertions and updates in the announcements table

module.exports = router;