const bcrypt = require('bcrypt');
const connection = require('../db');
const saltRounds = 10;

function updatePasswords(callback) {
    const selectSql = `SELECT secretary_id, email FROM secretary WHERE password_hash = 'pending'`;

    let updatedCount = 0;
    let completed = 0;

    connection.query(selectSql, (err, results) => {
        if (err) return callback(err);

        // This means that the secretaries table includes only hashed passwords
        if (results.length === 0) {
            console.log('No pending passwords found.');
            return callback(null, 0); // nothing updated, returns no error, just a count of 0
        } else {
            // This means that the secretaries table includes non hashed passwords
            results.forEach((secretary) => {
            const plainPassword = `sec${secretary.secretary_id}@2025`;

            // Hash the password using bcrypt, this is where we hash the password
            bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
                if (err) return callback(err);

                // Update the secretary's password in the database
                const updatesecreateryPass = `UPDATE secretary SET password_hash = ? WHERE secretary_id = ?`;
                connection.query(updatesecreateryPass, [hash, secretary.secretary_id], (err) => {
                if (err) return callback(err);

                console.log(`Updated ${secretary.email} with password: ${plainPassword}`);
                });

                const updateuserPass = `UPDATE users SET password_hash = ? WHERE id = ? AND role = 'secretary'`;
                connection.query(updateuserPass, [hash, secretary.secretary_id], (err) => {
                if (err) return callback(err);
                console.log(`Updated users table for ${secretary.email}`);
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
