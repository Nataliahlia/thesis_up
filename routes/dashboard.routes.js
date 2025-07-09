const express = require('express');
const path = require('path');
const router = express.Router();

// If login is successful, redirect to the dashboard page, by sending a GET request to the correct dashboard
router.get('/dashboards/dashboardSecretary', (req, res) => {
  console.log('Serving dashboardSecretary.html');
  res.sendFile(path.join(__dirname, '..', 'thesis_up', 'dashboards/dashboardSecretary.html'));
});

// If login is successful, redirect to the dashboard page, by sending a GET request to the correct dashboard
router.get('/dashboards/dashboardProfessor', (req, res) => {
  console.log('Serving dashboardProfessor.html');
  res.sendFile(path.join(__dirname, '..', 'thesis_up', 'dashboards/dashboardProfessor.html'));
});

router.get('/dashboards/dashboardStudent', (req, res) => {
  console.log('Serving dashboardStudent.html');
  res.sendFile(path.join(__dirname, '..', 'thesis_up', 'dashboards/dashboardStudent.html'));
});

module.exports = router;