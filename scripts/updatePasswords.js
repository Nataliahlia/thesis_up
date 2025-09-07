const bcrypt = require('bcrypt');
const connection = require('../db');
const saltRounds = 10;

function updatePasswords(callback) {
    const selectSql = `SELECT id, email FROM users WHERE password_hash = 'pending' AND role = 'secretary'`;

    let updatedCount = 0;
    let completed = 0;

    connection.query(selectSql, (err, results) => {
        if (err) return callback(err);

        // This means that the users table includes only hashed passwords
        if (results.length === 0) {
            console.log('No pending passwords found.');
            return callback(null, 0); // nothing updated, returns no error, just a count of 0
        } else {
            console.log(`Found ${results.length} users with pending passwords.`);
            // This means that the users table includes non hashed passwords
            results.forEach((user) => {
                const plainPassword = `sec${user.id}@2025`;
                console.log(`Processing user ${user.email} with password: ${plainPassword}`);

                // Hash the password using bcrypt, this is where we hash the password
                bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
                    if (err) return callback(err);

                    // Update the user's password in the database
                    const updateUserPass = `UPDATE users SET password_hash = ? WHERE id = ? AND role = 'secretary'`;
                    connection.query(updateUserPass, [hash, user.id], (err) => {
                        if (err) return callback(err);

                        console.log(`Updated ${user.email} with hashed password`);
                        updatedCount++;
                        completed++;
                        if (completed === results.length) {
                            callback(null, updatedCount);
                        }
                    });
                });
            });
        }
    });
}
module.exports = updatePasswords;