const express = require('express');
const connection = require('../db');
const router = express.Router();

// Middleware για έλεγχο authentication
function requireAuth(req, res, next) {
    if (!req.session.user || !req.session.user.user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Middleware για έλεγχο ότι ο χρήστης είναι καθηγητής
function requireProfessor(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'professor') {
        return res.status(403).json({ error: 'Access denied. Professor role required.' });
    }
    next();
}

// POST route για υποβολή βαθμού από καθηγητή
router.post('/submit-grade', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id, grade, comment } = req.body;
    const professor_id = req.session.user.id; // ID του καθηγητή από το session

    // Validation
    if (!thesis_id || !grade) {
        return res.status(400).json({ 
            error: 'Thesis ID and grade are required' 
        });
    }

    // Έλεγχος ότι ο βαθμός είναι στο σωστό εύρος (0-10)
    if (grade < 0 || grade > 10) {
        return res.status(400).json({ 
            error: 'Grade must be between 0 and 10' 
        });
    }

    // Έλεγχος ότι η διπλωματική είναι "Υπό Εξέταση"
    const thesisCheckQuery = 'SELECT state, instructor_id, member1, member2 FROM thesis_topic WHERE thesis_id = ?';
    
    connection.query(thesisCheckQuery, [thesis_id], (err, thesisResults) => {
        if (err) {
            console.error('Error checking thesis:', err);
            return res.status(500).json({ 
                error: 'Internal server error',
                details: err.message 
            });
        }

        if (thesisResults.length === 0) {
            return res.status(404).json({ error: 'Thesis not found' });
        }

        const thesis = thesisResults[0];
        
        if (thesis.state !== 'Υπό Εξέταση') {
            return res.status(400).json({ 
                error: 'Thesis must be under examination to submit grades' 
            });
        }

        // Έλεγχος ότι ο καθηγητής είναι μέλος της επιτροπής
        const isCommitteeMember = [thesis.instructor_id, thesis.member1, thesis.member2]
            .includes(professor_id);

        if (!isCommitteeMember) {
            return res.status(403).json({ 
                error: 'You are not a member of this thesis committee' 
            });
        }

        // Έλεγχος ότι ο καθηγητής δεν έχει ήδη υποβάλει βαθμό
        const existingGradeQuery = 'SELECT id FROM thesis_comments WHERE thesis_id = ? AND professor_id = ? AND comment_type = "final"';
        
        connection.query(existingGradeQuery, [thesis_id, professor_id], (err, existingResults) => {
            if (err) {
                console.error('Error checking existing grade:', err);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            if (existingResults.length > 0) {
                // Ενημέρωση υπάρχοντος βαθμού
                const updateQuery = 'UPDATE thesis_comments SET grade = ?, comment = ?, comment_date = NOW() WHERE thesis_id = ? AND professor_id = ? AND comment_type = "final"';
                
                connection.query(updateQuery, [grade, comment || '', thesis_id, professor_id], (err) => {
                    if (err) {
                        console.error('Error updating grade:', err);
                        return res.status(500).json({ 
                            error: 'Internal server error',
                            details: err.message 
                        });
                    }
                    
                    checkAllGrades(thesis_id, thesis, res);
                });
            } else {
                // Εισαγωγή νέου βαθμού
                const insertQuery = 'INSERT INTO thesis_comments (thesis_id, professor_id, comment, grade, comment_type) VALUES (?, ?, ?, ?, "final")';
                
                connection.query(insertQuery, [thesis_id, professor_id, comment || '', grade], (err) => {
                    if (err) {
                        console.error('Error inserting grade:', err);
                        return res.status(500).json({ 
                            error: 'Internal server error',
                            details: err.message 
                        });
                    }
                    
                    checkAllGrades(thesis_id, thesis, res);
                });
            }
        });
    });

    // Βοηθητική λειτουργία για έλεγχο όλων των βαθμών
    function checkAllGrades(thesis_id, thesis, res) {
        const gradeCountQuery = `SELECT COUNT(*) as total_grades
             FROM thesis_comments 
             WHERE thesis_id = ? 
             AND comment_type = 'final' 
             AND professor_id IN (?, ?, ?)`;
        
        connection.query(gradeCountQuery, [thesis_id, thesis.instructor_id, thesis.member1, thesis.member2], (err, countResults) => {
            if (err) {
                console.error('Error counting grades:', err);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            const totalGrades = countResults[0].total_grades;
            const allGradesSubmitted = totalGrades === 3;

            // Παίρνουμε τον τελικό βαθμό αν έχει υπολογιστεί
            let finalGrade = null;
            if (allGradesSubmitted) {
                const finalGradeQuery = 'SELECT final_grade FROM thesis_topic WHERE thesis_id = ?';
                
                connection.query(finalGradeQuery, [thesis_id], (err, finalResults) => {
                    if (err) {
                        console.error('Error getting final grade:', err);
                        return res.status(500).json({ 
                            error: 'Internal server error',
                            details: err.message 
                        });
                    }
                    
                    finalGrade = finalResults[0]?.final_grade;
                    
                    res.json({
                        success: true,
                        message: 'Grade submitted successfully',
                        allGradesSubmitted,
                        finalGrade,
                        totalGrades
                    });
                });
            } else {
                res.json({
                    success: true,
                    message: 'Grade submitted successfully',
                    allGradesSubmitted,
                    finalGrade,
                    totalGrades
                });
            }
        });
    }
});

// GET route για να δει ο καθηγητής τους βαθμούς μιας διπλωματικής
router.get('/thesis/:thesis_id/grades', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id } = req.params;
    const professor_id = req.session.user.id;

    // Έλεγχος ότι ο καθηγητής είναι μέλος της επιτροπής
    const thesisCheckQuery = 'SELECT instructor_id, member1, member2, final_grade, state FROM thesis_topic WHERE thesis_id = ?';
    
    connection.query(thesisCheckQuery, [thesis_id], (err, thesisResults) => {
        if (err) {
            console.error('Error checking thesis:', err);
            return res.status(500).json({ 
                error: 'Internal server error',
                details: err.message 
            });
        }

        if (thesisResults.length === 0) {
            return res.status(404).json({ error: 'Thesis not found' });
        }

        const thesis = thesisResults[0];
        const isCommitteeMember = [thesis.instructor_id, thesis.member1, thesis.member2]
            .includes(professor_id);

        if (!isCommitteeMember) {
            return res.status(403).json({ 
                error: 'You are not a member of this thesis committee' 
            });
        }

        // Παίρνουμε όλους τους βαθμούς της διπλωματικής
        const gradesQuery = `SELECT tc.professor_id, tc.grade, tc.comment, tc.comment_date,
                p.name, p.surname
         FROM thesis_comments tc
         JOIN professor p ON tc.professor_id = p.professor_id
         WHERE tc.thesis_id = ? AND tc.comment_type = 'final'
         ORDER BY tc.comment_date`;
        
        connection.query(gradesQuery, [thesis_id], (err, gradesResults) => {
            if (err) {
                console.error('Error fetching grades:', err);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            // Παίρνουμε τα ονόματα όλων των μελών της επιτροπής
            const committeeMembersQuery = `SELECT professor_id, name, surname,
                    CASE 
                        WHEN professor_id = ? THEN 'Επιβλέπων'
                        ELSE 'Μέλος Επιτροπής'
                    END as role
             FROM professor 
             WHERE professor_id IN (?, ?, ?)`;
            
            connection.query(committeeMembersQuery, [thesis.instructor_id, thesis.instructor_id, thesis.member1, thesis.member2], (err, committeeResults) => {
                if (err) {
                    console.error('Error fetching committee members:', err);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                res.json({
                    success: true,
                    thesis_id,
                    state: thesis.state,
                    final_grade: thesis.final_grade,
                    committee_members: committeeResults,
                    submitted_grades: gradesResults,
                    total_submitted: gradesResults.length,
                    all_grades_submitted: gradesResults.length === 3
                });
            });
        });
    });
});

module.exports = router;
