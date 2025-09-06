const mysql = require('mysql2');

// Create a connection to the database with better error handling
const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'natalia',
  database: 'thesis_up',
  connectTimeout: 60000,
  multipleStatements: true
});

// Connect to the database with proper error handling
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    // Don't return here, let the app continue and handle connection errors per query
  } else {
    console.log('Connected to MySQL database');
  }
});

// Handle connection errors
connection.on('error', (err) => {
  console.error('Database connection error:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    // Reconnect if connection is lost
    console.log('Attempting to reconnect...');
    connection.connect();
  }
});

// This is used in order to access the connection from other files
module.exports = connection;