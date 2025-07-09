const bcrypt = require('bcrypt');
const connection = require('./db');

async function updateProfessorPassword() {
    try {
        // Generate bcrypt hash for password "1234"
        const hash = await bcrypt.hash('1234', 10);
        console.log('Generated hash for password "1234":', hash);
        
        // Update professor table
        connection.query('UPDATE professor SET password_hash = ? WHERE professor_id = 1', [hash], (err) => {
            if (err) {
                console.error('Error updating professor:', err);
                return;
            }
            console.log('Updated professor password');
        });
        
        // Update users table
        connection.query('UPDATE users SET password_hash = ? WHERE id = 1 AND role = "professor"', [hash], (err) => {
            if (err) {
                console.error('Error updating users:', err);
                return;
            }
            console.log('Updated users password');
            console.log('\nNow you can login with:');
            console.log('Email: prof1@ac.upatras.gr');
            console.log('Password: 1234');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateProfessorPassword();
