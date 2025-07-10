const express = require('express');
const router = express.Router();
const connection = require('../db');

// Get detailed thesis information (UC9)
router.get('/api/professor/thesis-details/:thesisId', (req, res) => {
    const thesisId = req.params.thesisId;
    const professorId = 1; // Mock professor ID for testing

    console.log(`Fetching thesis details for ID: ${thesisId}, Professor: ${professorId}`);

    // Main thesis query with join to get student and professor information
    const thesisQuery = `
        SELECT 
            tt.*,
            s.name as student_name, 
            s.surname as student_surname,
            s.email as student_email,
            s.mobile_telephone as student_phone,
            s.student_number,
            p.name as supervisor_name,
            p.surname as supervisor_surname,
            DATEDIFF(CURDATE(), tt.time_of_activation) as duration_days
        FROM thesis_topic tt
        LEFT JOIN student s ON tt.student_id = s.student_number
        LEFT JOIN professor p ON tt.instructor_id = p.professor_id
        WHERE tt.thesis_id = ?
        AND (tt.instructor_id = ? OR EXISTS (
            SELECT 1 FROM thesis_committee tc 
            WHERE tc.thesis_id = tt.thesis_id AND tc.professor_id = ?
        ))
    `;

    connection.query(thesisQuery, [thesisId, professorId, professorId], (err, thesisResult) => {
        if (err) {
            console.error('Error fetching thesis details:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (thesisResult.length === 0) {
            console.log(`No thesis found with ID ${thesisId} for professor ${professorId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Η διπλωματική δεν βρέθηκε ή δεν έχετε πρόσβαση σε αυτήν' 
            });
        }

        const thesis = thesisResult[0];
        console.log('Found thesis:', thesis.title);

        // Return simplified response for now
        const response = {
            success: true,
            data: {
                id: thesis.thesis_id,
                title: thesis.title,
                description: thesis.description,
                status: thesis.state,
                code: thesis.thesis_id,
                created_at: thesis.time_of_activation,
                assigned_at: thesis.time_of_activation,
                my_role: thesis.instructor_id === professorId ? 'supervisor' : 'member',
                student_id: thesis.student_id,
                student_name: thesis.student_name && thesis.student_surname ? 
                    `${thesis.student_name} ${thesis.student_surname}` : null,
                student_number: thesis.student_number,
                student_email: thesis.student_email,
                student_phone: thesis.student_phone,
                pdf_file: thesis.pdf,
                committee: [],
                events: [],
                files: [],
                comments: []
            }
        };

        res.json(response);
    });
});

// Cancel initial topic assignment (UC7)
router.post('/api/professor/cancel-assignment', (req, res) => {
    const { thesisId } = req.body;
    const professorId = 1; // Mock professor ID for testing
    
    console.log(`Cancel assignment request for thesis ${thesisId} by professor ${professorId}`);
    
    // Validation
    if (!thesisId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Το ID της διπλωματικής είναι υποχρεωτικό' 
        });
    }
    
    // Check if thesis belongs to professor and is under assignment
    const checkQuery = `
        SELECT thesis_id, title, student_id, state 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Υπό Ανάθεση'
    `;
    
    connection.query(checkQuery, [thesisId, professorId], (err, checkResult) => {
        if (err) {
            console.error('Error checking thesis for cancellation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (checkResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Η διπλωματική δεν βρέθηκε ή δεν είναι σε κατάσταση "Υπό Ανάθεση"' 
            });
        }
        
        // Start transaction for rollback assignment
        connection.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction start error:', transErr);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Reset thesis to unassigned state
            const resetQuery = `
                UPDATE thesis_topic 
                SET student_id = NULL, state = 'Χωρίς Ανάθεση', time_of_activation = NULL
                WHERE thesis_id = ? AND instructor_id = ?
            `;
            
            connection.query(resetQuery, [thesisId, professorId], (resetErr) => {
                if (resetErr) {
                    return connection.rollback(() => {
                        console.error('Error resetting thesis assignment:', resetErr);
                        res.status(500).json({ success: false, message: 'Database error' });
                    });
                }
                
                // Delete any pending committee invitations for this thesis
                const deleteInvitationsQuery = `
                    DELETE FROM thesis_committee 
                    WHERE thesis_id = ? AND status IN ('pending', 'invited')
                `;
                
                connection.query(deleteInvitationsQuery, [thesisId], (delInvErr) => {
                    if (delInvErr) {
                        return connection.rollback(() => {
                            console.error('Error deleting committee invitations:', delInvErr);
                            res.status(500).json({ success: false, message: 'Database error' });
                        });
                    }
                    
                    // Commit transaction
                    connection.commit((commitErr) => {
                        if (commitErr) {
                            return connection.rollback(() => {
                                console.error('Transaction commit error:', commitErr);
                                res.status(500).json({ success: false, message: 'Database error' });
                            });
                        }
                        
                        console.log(`Professor ${professorId} cancelled assignment for thesis ${thesisId}`);
                        res.json({ 
                            success: true,
                            message: 'Η ανάθεση ακυρώθηκε επιτυχώς'
                        });
                    });
                });
            });
        });
    });
});

// Get available topics (not assigned) for display and assignment
router.get('/api/professor/available-topics', (req, res) => {
    const professorId = 1; // Mock professor ID for testing
    
    console.log(`Fetching available topics for professor ${professorId}`);
    
    const query = `
        SELECT thesis_id, title, description, instructor_id
        FROM thesis_topic 
        WHERE instructor_id = ? AND state = 'Χωρίς Ανάθεση'
        ORDER BY title
    `;
    
    connection.query(query, [professorId], (err, results) => {
        if (err) {
            console.error('Error fetching available topics:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`Found ${results.length} available topics`);
        res.json(results);
    });
});

// Delete a thesis topic (only if not assigned)
router.delete('/api/professor/delete-topic/:topicId', (req, res) => {
    const topicId = req.params.topicId;
    const professorId = 1; // Mock professor ID for testing
    
    console.log(`Delete topic request for topic ${topicId} by professor ${professorId}`);
    
    // Validation
    if (!topicId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Το ID του θέματος είναι υποχρεωτικό' 
        });
    }
    
    // Check if topic belongs to professor and is not assigned
    const checkQuery = `
        SELECT thesis_id, title, student_id, state 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Χωρίς Ανάθεση'
    `;
    
    connection.query(checkQuery, [topicId, professorId], (err, checkResult) => {
        if (err) {
            console.error('Error checking topic for deletion:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (checkResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Το θέμα δεν βρέθηκε ή δεν μπορεί να διαγραφεί (είναι ανατεθειμένο)' 
            });
        }
        
        // Start transaction for deletion
        connection.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction start error:', transErr);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Delete any committee invitations for this thesis first
            const deleteInvitationsQuery = `
                DELETE FROM thesis_committee 
                WHERE thesis_id = ?
            `;
            
            connection.query(deleteInvitationsQuery, [topicId], (delInvErr) => {
                if (delInvErr) {
                    return connection.rollback(() => {
                        console.error('Error deleting committee invitations:', delInvErr);
                        res.status(500).json({ success: false, message: 'Database error' });
                    });
                }
                
                // Delete the thesis topic
                const deleteTopicQuery = `
                    DELETE FROM thesis_topic 
                    WHERE thesis_id = ? AND instructor_id = ?
                `;
                
                connection.query(deleteTopicQuery, [topicId, professorId], (deleteErr) => {
                    if (deleteErr) {
                        return connection.rollback(() => {
                            console.error('Error deleting thesis topic:', deleteErr);
                            res.status(500).json({ success: false, message: 'Database error' });
                        });
                    }
                    
                    // Commit transaction
                    connection.commit((commitErr) => {
                        if (commitErr) {
                            return connection.rollback(() => {
                                console.error('Transaction commit error:', commitErr);
                                res.status(500).json({ success: false, message: 'Database error' });
                            });
                        }
                        
                        console.log(`Professor ${professorId} deleted topic ${topicId}`);
                        res.json({ 
                            success: true,
                            message: 'Το θέμα διαγράφηκε επιτυχώς'
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
