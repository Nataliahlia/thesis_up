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
    const thesisCheckQuery = 'SELECT state, instructor_id, member1, member2, draft_file FROM thesis_topic WHERE thesis_id = ?';
    
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

        // ΝΕΟΣ ΕΛΕΓΧΟΣ: Έλεγχος ότι έχει καταβληθεί το προσχέδιο
        if (!thesis.draft_file) {
            return res.status(400).json({ 
                error: 'Η βαθμολόγηση δεν είναι διαθέσιμη. Ο φοιτητής πρέπει πρώτα να καταβάλει το προσχέδιο της διπλωματικής.',
                errorCode: 'DRAFT_FILE_MISSING'
            });
        }

        // ΝΕΟΣ ΕΛΕΓΧΟΣ: Έλεγχος ότι έχουν καταβληθεί οι πληροφορίες εξέτασης
        const announcementCheckQuery = 'SELECT id FROM announcements WHERE thesis_id = ?';
        
        connection.query(announcementCheckQuery, [thesis_id], (err, announcementResults) => {
            if (err) {
                console.error('Error checking examination details:', err);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            if (announcementResults.length === 0) {
                return res.status(400).json({ 
                    error: 'Η βαθμολόγηση δεν είναι διαθέσιμη. Ο φοιτητής πρέπει πρώτα να καταβάλει τις πληροφορίες εξέτασης (ημερομηνία, ώρα, τρόπος εξέτασης).',
                    errorCode: 'EXAMINATION_DETAILS_MISSING'
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

// POST route για ενεργοποίηση βαθμολόγησης από supervisor
router.post('/enable-committee-grading', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id } = req.body;
    const professor_id = req.session.user.id;

    // Validation
    if (!thesis_id) {
        return res.status(400).json({ 
            error: 'Thesis ID is required' 
        });
    }

    // Έλεγχος ότι η διπλωματική υπάρχει και ότι ο καθηγητής είναι supervisor
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
        
        // Έλεγχος ότι ο καθηγητής είναι supervisor (instructor)
        if (thesis.instructor_id !== professor_id) {
            return res.status(403).json({ 
                error: 'Only the supervisor can enable committee grading' 
            });
        }

        if (thesis.state !== 'Υπό Εξέταση') {
            return res.status(400).json({ 
                error: 'Thesis must be under examination to enable grading' 
            });
        }

        // Εδώ μπορούμε να προσθέσουμε λογική για να ειδοποιήσουμε τα μέλη της επιτροπής
        // Προς το παρόν απλά επιστρέφουμε επιτυχία
        // Στο μέλλον μπορούμε να προσθέσουμε notifications, emails κτλ.

        console.log(`Supervisor ${professor_id} enabled grading for thesis ${thesis_id}`);
        
        res.json({
            success: true,
            message: 'Committee grading enabled successfully',
            thesis_id: thesis_id
        });
    });
});

// GET route για να δει ο καθηγητής τους βαθμούς μιας διπλωματικής
router.get('/thesis/:thesis_id/grades', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id } = req.params;
    const professor_id = req.session.user.id;

    // Έλεγχος ότι ο καθηγητής είναι μέλος της επιτροπής
    const thesisCheckQuery = 'SELECT instructor_id, member1, member2, final_grade, state, draft_file FROM thesis_topic WHERE thesis_id = ?';
    
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

        // Έλεγχος για τα απαραίτητα αρχεία
        const announcementCheckQuery = 'SELECT id FROM announcements WHERE thesis_id = ?';
        
        connection.query(announcementCheckQuery, [thesis_id], (err, announcementResults) => {
            if (err) {
                console.error('Error checking examination details:', err);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            const canGrade = thesis.draft_file && announcementResults.length > 0;
            const missingRequirements = [];

            if (!thesis.draft_file) {
                missingRequirements.push('Προσχέδιο της διπλωματικής');
            }
            if (announcementResults.length === 0) {
                missingRequirements.push('Πληροφορίες εξέτασης (ημερομηνία, ώρα, τρόπος)');
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
                        all_grades_submitted: gradesResults.length === 3,
                        can_grade: canGrade,
                        grading_blocked: !canGrade,
                        missing_requirements: missingRequirements,
                        draft_file_uploaded: !!thesis.draft_file,
                        examination_details_submitted: announcementResults.length > 0
                    });
                });
            });
        });
    });
});

// GET route για να δει ο διδάσκων το draft file του φοιτητή
router.get('/thesis/:thesis_id/draft-file', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id } = req.params;
    const professor_id = req.session.user.id;

    // Έλεγχος ότι η διπλωματική υπάρχει και ο καθηγητής είναι μέλος της τριμελούς επιτροπής
    const thesisCheckQuery = `
        SELECT 
            tt.state, 
            tt.instructor_id, 
            tt.member1,
            tt.member2,
            tt.draft_file,
            tt.title,
            s.name as student_name,
            s.surname as student_surname,
            s.student_number
        FROM thesis_topic tt
        LEFT JOIN student s ON tt.student_id = s.student_number
        WHERE tt.thesis_id = ?
    `;
    
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

        // Έλεγχος ότι ο καθηγητής είναι μέλος της τριμελούς επιτροπής
        const isCommitteeMember = [thesis.instructor_id, thesis.member1, thesis.member2]
            .includes(professor_id);
            
        if (!isCommitteeMember) {
            return res.status(403).json({ 
                error: 'Access denied. Only thesis committee members can view the draft file.' 
            });
        }

        // Έλεγχος ότι η διπλωματική είναι "Υπό Εξέταση"
        if (thesis.state !== 'Υπό Εξέταση') {
            return res.status(400).json({ 
                error: 'Draft file can only be viewed when thesis is under examination.' 
            });
        }

        // Έλεγχος ότι υπάρχει draft file
        if (!thesis.draft_file) {
            return res.status(404).json({ 
                error: 'No draft file has been uploaded by the student yet.',
                errorCode: 'DRAFT_FILE_NOT_FOUND'
            });
        }

        // Επιστροφή των πληροφοριών του draft file
        res.json({
            success: true,
            thesis_id,
            thesis_title: thesis.title,
            student_info: {
                name: thesis.student_name,
                surname: thesis.student_surname,
                student_number: thesis.student_number
            },
            draft_file: {
                filename: thesis.draft_file,
                // Για security, επιστρέφουμε μόνο το όνομα του αρχείου
                // Το πραγματικό download θα γίνει από ξεχωριστό endpoint
                download_url: `/api/thesis/${thesis_id}/draft-file/download`
            },
            message: 'Draft file information retrieved successfully'
        });
    });
});

// GET route για download του draft file (ο πραγματικός download)
router.get('/thesis/:thesis_id/draft-file/download', requireAuth, requireProfessor, (req, res) => {
    const { thesis_id } = req.params;
    const professor_id = req.session.user.id;
    const path = require('path');
    const fs = require('fs');

    // Έλεγχος δικαιωμάτων και λήψη πληροφοριών αρχείου
    const thesisCheckQuery = `
        SELECT 
            tt.state, 
            tt.instructor_id, 
            tt.member1,
            tt.member2,
            tt.draft_file
        FROM thesis_topic tt
        WHERE tt.thesis_id = ?
    `;
    
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

        // Έλεγχος ότι ο καθηγητής είναι μέλος της τριμελούς επιτροπής
        const isCommitteeMember = [thesis.instructor_id, thesis.member1, thesis.member2]
            .includes(professor_id);
            
        if (!isCommitteeMember) {
            return res.status(403).json({ 
                error: 'Access denied. Only thesis committee members can download the draft file.' 
            });
        }

        if (thesis.state !== 'Υπό Εξέταση') {
            return res.status(400).json({ 
                error: 'Draft file can only be downloaded when thesis is under examination.' 
            });
        }

        if (!thesis.draft_file) {
            return res.status(404).json({ 
                error: 'No draft file available for download.' 
            });
        }

        // Κατασκευή του path προς το αρχείο
        // Υποθέτω ότι τα draft files αποθηκεύονται στο uploads/draft_files/
        const filePath = path.join(__dirname, '..', 'uploads', 'draft_files', thesis.draft_file);

        // Έλεγχος ότι το αρχείο υπάρχει
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Draft file not found on disk:', filePath, err);
                return res.status(404).json({ 
                    error: 'Draft file not found on server.' 
                });
            }

            // Καθορισμός του content type βάσει επέκτασης
            const ext = path.extname(thesis.draft_file).toLowerCase();
            let contentType = 'application/octet-stream';
            
            if (ext === '.pdf') {
                contentType = 'application/pdf';
            } else if (ext === '.doc') {
                contentType = 'application/msword';
            } else if (ext === '.docx') {
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            }

            // Ορισμός headers για download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${thesis.draft_file}"`);

            // Αποστολή του αρχείου
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error sending draft file:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ 
                            error: 'Error downloading file' 
                        });
                    }
                }
            });
        });
    });
});

module.exports = router;
