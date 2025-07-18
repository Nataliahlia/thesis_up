// UC13 - Notes Routes (using existing thesis_comments table)
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all notes for a thesis (using thesis_comments table)
router.get('/api/notes/:thesisId', (req, res) => {
    const { thesisId } = req.params;
    
    // Check if user is logged in and is a professor
    if (!req.session.user || req.session.user.role !== 'professor') {
        return res.status(403).json({
            success: false,
            message: 'Δεν έχετε δικαίωμα πρόσβασης'
        });
    }
    
    const userId = req.session.user.id; // This is the professor_id
    
    // Verify that the user has access to this thesis
    const authQuery = `
        SELECT t.thesis_id, t.instructor_id,
               tc.professor_id as committee_professor_id
        FROM thesis_topic t
        LEFT JOIN thesis_committee tc ON t.thesis_id = tc.thesis_id
        WHERE t.thesis_id = ? AND (t.instructor_id = ? OR tc.professor_id = ?)
    `;
    
    db.query(authQuery, [thesisId, userId, userId], (err, authResult) => {
        if (err) {
            console.error('Error verifying access:', err);
            return res.status(500).json({
                success: false,
                message: 'Σφάλμα κατά την επαλήθευση πρόσβασης'
            });
        }
        
        if (!authResult || authResult.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Δεν έχετε πρόσβαση σε αυτή τη διπλωματική'
            });
        }
        
        // Get notes with author information (only notes types, not grades)
        const notesQuery = `
            SELECT tc.*, 
                   p.name as author_name,
                   p.surname as author_surname,
                   p.email as author_email,
                   CONCAT(p.name, ' ', p.surname) as author_full_name
            FROM thesis_comments tc
            INNER JOIN professor p ON tc.professor_id = p.professor_id
            WHERE tc.thesis_id = ? 
            AND tc.comment_type IN ('general', 'meeting', 'deadline', 'issue', 'achievement', 'progress')
            ORDER BY tc.comment_date DESC
        `;

        db.query(notesQuery, [thesisId], (err, notes) => {
            if (err) {
                console.error('Error fetching notes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Σφάλμα κατά τη φόρτωση των σημειώσεων'
                });
            }
            
            res.json({
                success: true,
                data: notes || []
            });
        });
    });
});

// Create a new note (using thesis_comments table)
router.post('/api/notes', (req, res) => {
    const { thesis_id, title, content, type } = req.body;
    
    // Check if user is logged in and is a professor
    if (!req.session.user || req.session.user.role !== 'professor') {
        return res.status(403).json({
            success: false,
            message: 'Δεν έχετε δικαίωμα πρόσβασης'
        });
    }
    
    const userId = req.session.user.id; // This is the professor_id
    
    if (!thesis_id || !title || !content || !type) {
        return res.status(400).json({
            success: false,
            message: 'Όλα τα πεδία είναι υποχρεωτικά'
        });
    }
    
    // Verify that the user has access to this thesis
    const authQuery = `
        SELECT t.thesis_id, t.instructor_id,
               tc.professor_id as committee_professor_id
        FROM thesis_topic t
        LEFT JOIN thesis_committee tc ON t.thesis_id = tc.thesis_id
        WHERE t.thesis_id = ? AND (t.instructor_id = ? OR tc.professor_id = ?)
    `;
    
    db.query(authQuery, [thesis_id, userId, userId], (err, authResult) => {
        if (err) {
            console.error('Error verifying access:', err);
            return res.status(500).json({
                success: false,
                message: 'Σφάλμα κατά την επαλήθευση πρόσβασης'
            });
        }
        
        if (!authResult || authResult.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Δεν έχετε πρόσβαση σε αυτή τη διπλωματική'
            });
        }
        
        // Insert the note into thesis_comments
        const insertQuery = `
            INSERT INTO thesis_comments (thesis_id, professor_id, title, comment, comment_type, comment_date, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        db.query(insertQuery, [thesis_id, userId, title, content, type], (err, result) => {
            if (err) {
                console.error('Error creating note:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Σφάλμα κατά τη δημιουργία της σημείωσης'
                });
            }
            
            if (result && result.insertId) {
                // Get the created note with author info
                const noteQuery = `
                    SELECT tc.*, 
                           p.name as author_name,
                           p.surname as author_surname,
                           p.email as author_email,
                           CONCAT(p.name, ' ', p.surname) as author_full_name
                    FROM thesis_comments tc
                    INNER JOIN professor p ON tc.professor_id = p.professor_id
                    WHERE tc.id = ?
                `;
                
                db.query(noteQuery, [result.insertId], (err, createdNote) => {
                    if (err) {
                        console.error('Error fetching created note:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Σφάλμα κατά τη φόρτωση της νέας σημείωσης'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Η σημείωση δημιουργήθηκε επιτυχώς',
                        data: createdNote[0]
                    });
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Αποτυχία δημιουργίας σημείωσης'
                });
            }
        });
    });
});

// Update a note (using thesis_comments table)
router.put('/api/notes/:noteId', (req, res) => {
    const { noteId } = req.params;
    const { title, content, type } = req.body;
    
    // Check if user is logged in and is a professor
    if (!req.session.user || req.session.user.role !== 'professor') {
        return res.status(403).json({
            success: false,
            message: 'Δεν έχετε δικαίωμα πρόσβασης'
        });
    }
    
    const userId = req.session.user.id; // This is the professor_id
    
    if (!title || !content || !type) {
        return res.status(400).json({
            success: false,
            message: 'Όλα τα πεδία είναι υποχρεωτικά'
        });
    }
    
    // Verify that the user is the author of this note
    const authQuery = `
        SELECT id, professor_id, thesis_id
        FROM thesis_comments
        WHERE id = ? AND professor_id = ?
    `;
    
    db.query(authQuery, [noteId, userId], (err, authResult) => {
        if (err) {
            console.error('Error verifying note ownership:', err);
            return res.status(500).json({
                success: false,
                message: 'Σφάλμα κατά την επαλήθευση δικαιωμάτων'
            });
        }
        
        if (!authResult || authResult.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Δεν έχετε δικαίωμα επεξεργασίας αυτής της σημείωσης'
            });
        }
        
        // Update the note
        const updateQuery = `
            UPDATE thesis_comments 
            SET title = ?, comment = ?, comment_type = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        db.query(updateQuery, [title, content, type, noteId], (err) => {
            if (err) {
                console.error('Error updating note:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Σφάλμα κατά την ενημέρωση της σημείωσης'
                });
            }
            
            // Get the updated note with author info
            const noteQuery = `
                SELECT tc.*, 
                       p.name as author_name,
                       p.surname as author_surname,
                       p.email as author_email,
                       CONCAT(p.name, ' ', p.surname) as author_full_name
                FROM thesis_comments tc
                INNER JOIN professor p ON tc.professor_id = p.professor_id
                WHERE tc.id = ?
            `;
            
            db.query(noteQuery, [noteId], (err, updatedNote) => {
                if (err) {
                    console.error('Error fetching updated note:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Σφάλμα κατά τη φόρτωση της ενημερωμένης σημείωσης'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Η σημείωση ενημερώθηκε επιτυχώς',
                    data: updatedNote[0]
                });
            });
        });
    });
});

// Delete a note (using thesis_comments table)
router.delete('/api/notes/:noteId', (req, res) => {
    const { noteId } = req.params;
    
    // Check if user is logged in and is a professor
    if (!req.session.user || req.session.user.role !== 'professor') {
        return res.status(403).json({
            success: false,
            message: 'Δεν έχετε δικαίωμα πρόσβασης'
        });
    }
    
    const userId = req.session.user.id; // This is the professor_id
    
    // Verify that the user is the author of this note
    const authQuery = `
        SELECT id, professor_id, thesis_id
        FROM thesis_comments
        WHERE id = ? AND professor_id = ?
    `;
    
    db.query(authQuery, [noteId, userId], (err, authResult) => {
        if (err) {
            console.error('Error verifying note ownership:', err);
            return res.status(500).json({
                success: false,
                message: 'Σφάλμα κατά την επαλήθευση δικαιωμάτων'
            });
        }
        
        if (!authResult || authResult.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Δεν έχετε δικαίωμα διαγραφής αυτής της σημείωσης'
            });
        }
        
        // Delete the note
        const deleteQuery = `DELETE FROM thesis_comments WHERE id = ?`;
        
        db.query(deleteQuery, [noteId], (err) => {
            if (err) {
                console.error('Error deleting note:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Σφάλμα κατά τη διαγραφή της σημείωσης'
                });
            }
            
            res.json({
                success: true,
                message: 'Η σημείωση διαγράφηκε επιτυχώς'
            });
        });
    });
});

module.exports = router;
