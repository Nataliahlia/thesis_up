const express = require('express');
const router = express.Router();
const connection = require('../db');
const multer = require('multer');
const path = require('path');

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/thesis-pdfs/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'thesis-' + uniqueSuffix + '.pdf');
    }
});

const uploadPDF = multer({ 
    storage: pdfStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to get authenticated professor ID
function getAuthenticatedProfessorId(req, res) {
    if (!req.session || !req.session.user) {
        res.status(401).json({ success: false, message: 'Not logged in' });
        return null;
    }
    // Use 'id' field from users table which corresponds to professor_id
    return req.session.user.id;
}

// Debug test endpoint
router.get('/api/professor/debug-test', (req, res) => {
    res.json({ message: 'Debug endpoint works!', timestamp: new Date() });
});

// ===== DASHBOARD PAGE ROUTE =====
router.get('/professor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../thesis_up', 'dashboards', 'dashboardProfessor.html'));
});

router.get('/dashboards/dashboardProfessor', (req, res) => {
    res.sendFile(path.join(__dirname, '../thesis_up', 'dashboards', 'dashboardProfessor.html'));
});

// ===== STATIC FILE SERVING =====

// Serve uploaded PDF files
router.get('/uploads/thesis-pdfs/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/thesis-pdfs', filename);
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('../') || filename.includes('..\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving PDF file:', err);
            res.status(404).json({ error: 'File not found' });
        }
    });
});

// ===== API ROUTES =====

// Get professor's available topics for assignment
router.get('/api/professor/available-topics', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const professorId = req.session.user.id;
    const query = `
        SELECT thesis_id, title, description 
        FROM thesis_topic 
        WHERE instructor_id = ? AND state = 'Χωρίς Ανάθεση'
        ORDER BY title
    `;
    
    connection.query(query, [professorId], (err, results) => {
        if (err) {
            console.error('Error fetching available topics:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Search students for topic assignment (only available students without thesis)
router.get('/api/professor/search-students', (req, res) => {
    const searchTerm = req.query.term;
    
    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }
    
    const query = `
        SELECT s.student_number, s.name, s.surname, s.email 
        FROM student s
        LEFT JOIN thesis_topic t ON s.student_number = t.student_id
        WHERE (s.student_number LIKE ? OR s.name LIKE ? OR s.surname LIKE ? OR s.email LIKE ?)
        AND t.student_id IS NULL
        ORDER BY s.student_number
        LIMIT 10
    `;
    
    const searchPattern = `%${searchTerm}%`;
    connection.query(query, [searchPattern, searchPattern, searchPattern, searchPattern], (err, results) => {
        if (err) {
            console.error('Error searching available students:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get professor's theses (as supervisor or committee member)
router.get('/api/professor/my-theses', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    const professorId = req.session.user.id;
    console.log('Loading theses for professor ID:', professorId);
    console.log('Full session user:', req.session.user);
    
    const query = `
        SELECT 
            t.thesis_id as id,
            t.thesis_id as code,
            t.title,
            s.name as student_name,
            s.surname as student_surname,
            s.student_number as studentId,
            t.state as status,
            CASE 
                WHEN t.instructor_id = ? THEN 'supervisor'
                WHEN t.member1 = ? OR t.member2 = ? THEN 'member'
                ELSE 'other'
            END as my_role,
            t.time_of_activation as assigned_at,
            DATEDIFF(NOW(), t.time_of_activation) as duration,
            t.pdf as pdfFile,
            p.name as professor_name,
            (SELECT MIN(te.event_date) 
             FROM thesis_events te 
             WHERE te.thesis_id = t.thesis_id 
             AND te.event_type = 'Δημιουργία Θέματος'
            ) as created_at,
            (SELECT COUNT(*) 
             FROM announcements a 
             WHERE a.thesis_id = t.thesis_id 
             AND a.date IS NOT NULL 
             AND a.time IS NOT NULL 
             AND a.type IS NOT NULL 
             AND a.location_or_link IS NOT NULL
            ) > 0 as has_presentation_details,
            (SELECT COUNT(*) 
             FROM announcements a 
             WHERE a.thesis_id = t.thesis_id 
             AND a.state = 'waiting'
            ) > 0 as has_waiting_announcement
        FROM thesis_topic t
        LEFT JOIN student s ON t.student_id = s.student_number
        JOIN professor p ON t.instructor_id = p.professor_id
        WHERE t.instructor_id = ? OR t.member1 = ? OR t.member2 = ?
        ORDER BY t.time_of_activation DESC
    `;
    
    connection.query(query, [professorId, professorId, professorId, professorId, professorId, professorId], (err, results) => {
        if (err) {
            console.error('Error fetching professor theses:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Raw database results:', results);
        
        // Transform the data for frontend
        const transformedResults = results.map(thesis => ({
            ...thesis,
            student: thesis.student_name && thesis.student_surname ? 
                `${thesis.student_name} ${thesis.student_surname}` : 'Μη ανατεθειμένη',
            assigned_at: thesis.assigned_at ? thesis.assigned_at.toISOString().split('T')[0] : null,
            created_at: thesis.created_at ? thesis.created_at.toISOString().split('T')[0] : null,
            duration: thesis.duration || 0
        }));
        
        console.log('Transformed results:', transformedResults);
        
        res.json(transformedResults);
    });
});

// Debug test endpoint after my-theses
router.get('/api/professor/debug-test-2', (req, res) => {
    res.json({ message: 'Debug endpoint 2 works!', timestamp: new Date() });
});

// Create new thesis topic
router.post('/api/professor/create-topic', uploadPDF.single('pdf'), (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { title, description } = req.body;
    const pdfPath = req.file ? req.file.filename : null;
    const professorId = req.session.user.id;
    
    // Validation
    if (!title || !description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Τίτλος και περιγραφή είναι υποχρεωτικά' 
        });
    }
    
    if (title.length > 150) {
        return res.status(400).json({ 
            success: false, 
            message: 'Ο τίτλος δεν πρέπει να υπερβαίνει τους 150 χαρακτήρες' 
        });
    }
    
    const query = `
        INSERT INTO thesis_topic (title, description, instructor_id, pdf, state)
        VALUES (?, ?, ?, ?, 'Χωρίς Ανάθεση')
    `;
    
    connection.query(query, [title, description, professorId, pdfPath], (err, result) => {
        if (err) {
            console.error('Error creating thesis topic:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        const newTopicId = result.insertId;
        
        // Log the topic creation event
        const eventQuery = `
            INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
            VALUES (?, 'Δημιουργία Θέματος', ?, NOW(), 'Χωρίς Ανάθεση', ?)
        `;
        
        const eventDescription = `Δημιουργία νέου θέματος διπλωματικής: "${title}"`;
        
        connection.query(eventQuery, [newTopicId, eventDescription, professorId], (eventErr) => {
            if (eventErr) {
                console.error('Error recording topic creation event:', eventErr);
            }
        });
        
        console.log(`Professor ${professorId} created new topic: "${title}"`);
        res.json({ success: true, topicId: newTopicId });
    });
});

// Assign topic to student
router.post('/api/professor/assign-topic', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { topicId, studentId } = req.body;
    const professorId = req.session.user.id;
    
    // Validation
    if (!topicId || !studentId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Θέμα και φοιτητής είναι υποχρεωτικά' 
        });
    }
    
    // Check if topic belongs to professor and is available
    const checkQuery = `
        SELECT thesis_id, title 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Χωρίς Ανάθεση'
    `;
    
    connection.query(checkQuery, [topicId, professorId], (err, checkResult) => {
        if (err) {
            console.error('Error checking topic ownership:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (checkResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Το θέμα δεν βρέθηκε ή δεν είναι διαθέσιμο' 
            });
        }
        
        // Check if student exists
        const studentQuery = 'SELECT student_number FROM student WHERE student_number = ?';
        connection.query(studentQuery, [studentId], (err, studentResult) => {
            if (err) {
                console.error('Error checking student:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (studentResult.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ο φοιτητής δεν βρέθηκε' 
                });
            }
            
            // Assign topic to student
            const assignQuery = `
                UPDATE thesis_topic 
                SET student_id = ?, state = 'Υπό Ανάθεση', time_of_activation = NOW()
                WHERE thesis_id = ? AND instructor_id = ?
            `;
            
            connection.query(assignQuery, [studentId, topicId, professorId], (err, result) => {
                if (err) {
                    console.error('Error assigning topic:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                // Log the assignment event
                const eventQuery = `
                    INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                    VALUES (?, 'Ανάθεση Θέματος', ?, NOW(), 'Υπό Ανάθεση', ?)
                `;
                
                const eventDescription = `Αρχική ανάθεση θέματος σε φοιτητή (ID: ${studentId})`;
                
                connection.query(eventQuery, [topicId, eventDescription, professorId], (eventErr) => {
                    if (eventErr) {
                        console.error('Error recording assignment event:', eventErr);
                    }
                });
                
                console.log(`Professor ${professorId} assigned topic ${topicId} to student ${studentId}`);
                res.json({ success: true });
            });
        });
    });
});

// Cancel initial topic assignment (UC7)
router.post('/api/professor/cancel-assignment', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { thesisId } = req.body;
    const professorId = req.session.user.id;
    
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
                message: 'Η διπλωματική δεν βρέθηκε ή δεν είναι υπό ανάθεση' 
            });
        }
        
        const thesis = checkResult[0];
        
        // Start transaction to cancel assignment and delete related invitations
        connection.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction start error:', transErr);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Cancel the assignment - reset to available
            const cancelQuery = `
                UPDATE thesis_topic 
                SET student_id = NULL, state = 'Χωρίς Ανάθεση', time_of_activation = NULL
                WHERE thesis_id = ? AND instructor_id = ?
            `;
            
            connection.query(cancelQuery, [thesisId, professorId], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Error cancelling assignment:', err);
                        res.status(500).json({ success: false, message: 'Database error' });
                    });
                }
                
                // Delete any pending committee invitations for this thesis
                const deleteInvitationsQuery = `
                    DELETE FROM thesis_committee 
                    WHERE thesis_id = ? AND status = 'pending'
                `;
                
                connection.query(deleteInvitationsQuery, [thesisId], (err, delResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Error deleting invitations:', err);
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
                        
                        // Log the cancellation event
                        const eventQuery = `
                            INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                            VALUES (?, 'Ακύρωση Ανάθεσης', ?, NOW(), 'Χωρίς Ανάθεση', ?)
                        `;
                        
                        const eventDescription = `Ακύρωση αρχικής ανάθεσης θέματος από τον επιβλέποντα`;
                        
                        connection.query(eventQuery, [thesisId, eventDescription, professorId], (eventErr) => {
                            if (eventErr) {
                                console.error('Error recording cancellation event:', eventErr);
                            }
                        });
                        
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

// Cancel active thesis (after 2 years with assembly decision)
router.post('/api/professor/cancel-active-thesis', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { thesisId, assemblyNumber, assemblyYear, reason } = req.body;
    const professorId = req.session.user.id;
    
    // Validation
    if (!thesisId || !assemblyNumber || !assemblyYear || !reason) {
        return res.status(400).json({ 
            success: false, 
            message: 'Όλα τα στοιχεία (ID διπλωματικής, αριθμός συνέλευσης, έτος, λόγος) είναι υποχρεωτικά' 
        });
    }
    
    // Check if thesis belongs to professor and is active
    const checkQuery = `
        SELECT 
            tt.thesis_id, 
            tt.title, 
            tt.student_id, 
            tt.state,
            tt.time_of_activation as assigned_at,
            u.name as student_name,
            u.surname as student_surname
        FROM thesis_topic tt
        LEFT JOIN users u ON tt.student_id = u.id
        WHERE tt.thesis_id = ? AND tt.instructor_id = ? AND tt.state = 'Ενεργή'
    `;
    
    connection.query(checkQuery, [thesisId, professorId], (err, checkResult) => {
        if (err) {
            console.error('Error checking thesis for active cancellation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (checkResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Η διπλωματική δεν βρέθηκε ή δεν είναι ενεργή' 
            });
        }
        
        const thesis = checkResult[0];
        
        // Check if 2 years have passed since assignment
        const assignmentDate = new Date(thesis.assigned_at);
        const currentDate = new Date();
        const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
        
        if ((currentDate - assignmentDate) < twoYearsInMs) {
            return res.status(400).json({ 
                success: false, 
                message: 'Δεν έχουν παρέλθει 2 έτη από την ανάθεση της διπλωματικής' 
            });
        }
        
        // Start transaction to cancel active thesis
        connection.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction start error:', transErr);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Update thesis state to cancelled
            const updateThesisQuery = `
                UPDATE thesis_topic 
                SET state = 'Ακυρωμένη'
                WHERE thesis_id = ?
            `;
            
            connection.query(updateThesisQuery, [thesisId], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Error updating thesis state:', err);
                        res.status(500).json({ success: false, message: 'Database error' });
                    });
                }
                
                if (result.affectedRows === 0) {
                    return connection.rollback(() => {
                        res.status(400).json({ 
                            success: false, 
                            message: 'Η διπλωματική δεν μπόρεσε να ακυρωθεί' 
                        });
                    });
                }
                
                // Insert cancellation record in canceled_thesis table
                const insertCancelQuery = `
                    INSERT INTO canceled_thesis (
                        id, reason, cancelled_at, assembly_number, assembly_year, 
                        professor_id, student_id, thesis_title
                    ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
                `;
                
                connection.query(insertCancelQuery, [
                    thesisId, 
                    reason, 
                    assemblyNumber, 
                    assemblyYear, 
                    professorId,
                    thesis.student_id,
                    thesis.title
                ], (insertErr) => {
                    if (insertErr) {
                        return connection.rollback(() => {
                            console.error('Error inserting cancellation record:', insertErr);
                            res.status(500).json({ success: false, message: 'Database error' });
                        });
                    }
                    
                    // Log the cancellation event (optional)
                    const logQuery = `
                        INSERT INTO thesis_events (thesis_id, event_type, description, event_date, created_by)
                        VALUES (?, 'Ακύρωση', ?, NOW(), ?)
                    `;
                    
                    const logDescription = `Ακύρωση ενεργής διπλωματικής από Διδάσκοντα. Γ.Σ. ${assemblyNumber}/${assemblyYear}`;
                    
                    connection.query(logQuery, [thesisId, logDescription, professorId], (logErr) => {
                        if (logErr) {
                            console.warn('Warning: Could not log cancellation event:', logErr);
                            // Continue anyway, don't fail the transaction
                        }
                        
                        // Commit transaction
                        connection.commit((commitErr) => {
                            if (commitErr) {
                                return connection.rollback(() => {
                                    console.error('Transaction commit error:', commitErr);
                                    res.status(500).json({ success: false, message: 'Database error' });
                                });
                            }
                            
                            console.log(`Professor ${professorId} cancelled active thesis ${thesisId} with assembly ${assemblyNumber}/${assemblyYear}`);
                            res.json({ 
                                success: true,
                                message: `Η ενεργή διπλωματική "${thesis.title}" ακυρώθηκε επιτυχώς`
                            });
                        });
                    });
                });
            });
        });
    });
});

// Update thesis details (UC9 - Edit functionality)
router.post('/api/professor/update-thesis/:id', uploadPDF.single('pdf'), (req, res) => {
    const thesisId = req.params.id;
    const { title, description, status } = req.body;
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return; // Error response already sent by helper
    
    // Validation
    if (!thesisId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Το ID της διπλωματικής είναι υποχρεωτικό' 
        });
    }
    
    if (!title || !description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Τίτλος και περιγραφή είναι υποχρεωτικά' 
        });
    }
    
    if (title.length > 150) {
        return res.status(400).json({ 
            success: false, 
            message: 'Ο τίτλος δεν πρέπει να υπερβαίνει τους 150 χαρακτήρες' 
        });
    }
    
    // Check if thesis exists and professor has permission to edit
    const checkQuery = `
        SELECT thesis_id, title, state, instructor_id, protocol_number 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ?
    `;
    
    connection.query(checkQuery, [thesisId, professorId], (err, checkResult) => {
        if (err) {
            console.error('Error checking thesis ownership:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (checkResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Η διπλωματική δεν βρέθηκε ή δεν έχετε δικαιώματα επεξεργασίας' 
            });
        }
        
        const currentThesis = checkResult[0];
        
        // Special validation for state changes
        if (status && status !== currentThesis.state) {
            // Only allow specific state transitions
            const currentState = currentThesis.state;
            
            // Only allow change from "Ενεργή" to "Υπό Εξέταση"
            if (currentState === 'Ενεργή' && status === 'Υπό Εξέταση') {
                // Check if protocol number exists for this transition
                if (!currentThesis.protocol_number) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Για να αλλάξει η κατάσταση σε "Υπό Εξέταση" πρέπει πρώτα να προστεθεί ο αριθμός πρωτοκόλλου της διπλωματικής.',
                        errorCode: 'PROTOCOL_NUMBER_REQUIRED'
                    });
                }
                // This transition is allowed and protocol number exists, proceed with update
            } else {
                // All other transitions are not allowed
                let errorMessage = `Δεν επιτρέπεται η αλλαγή κατάστασης από "${currentState}" σε "${status}".`;
                
                if (currentState === 'Ενεργή') {
                    errorMessage += ' Μπορείτε να αλλάξετε μόνο σε "Υπό Εξέταση".';
                } else {
                    errorMessage += ' Η κατάσταση μπορεί να αλλάξει μόνο όταν η διπλωματική είναι "Ενεργή".';
                }
                
                return res.status(400).json({ 
                    success: false, 
                    message: errorMessage,
                    errorCode: 'INVALID_STATUS_TRANSITION'
                });
            }
        }
        
        // If no special validation needed, proceed with update
        proceedWithUpdate();
        
        function proceedWithUpdate() {
            // Prepare update query
            let updateQuery = `
                UPDATE thesis_topic 
                SET title = ?, description = ?
            `;
            let queryParams = [title, description];
            
            // Add status update if provided and different
            if (status && status !== currentThesis.state) {
                updateQuery += ', state = ?';
                queryParams.push(status);
            }
            
            // Add PDF file if uploaded
            if (req.file) {
                updateQuery += ', pdf = ?';
                queryParams.push(req.file.filename);
            }
            
            updateQuery += ' WHERE thesis_id = ? AND instructor_id = ?';
            queryParams.push(thesisId, professorId);
            
            // Execute update
            connection.query(updateQuery, queryParams, (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error updating thesis:', updateErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Σφάλμα κατά την ενημέρωση της διπλωματικής' 
                });
            }
            
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Δεν βρέθηκε διπλωματική προς ενημέρωση' 
                });
            }
            
            // Log the update
            console.log(`Professor ${professorId} updated thesis ${thesisId}: "${title}"`);
            
            // Record status change event if status was changed
            if (status && status !== currentThesis.state) {
                const statusEventQuery = `
                    INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                    VALUES (?, 'Αλλαγή Κατάστασης', ?, NOW(), ?, ?)
                `;
                
                const statusDescription = `Αλλαγή κατάστασης από "${currentThesis.state}" σε "${status}"`;
                
                connection.query(statusEventQuery, [thesisId, statusDescription, status, professorId], (statusErr) => {
                    if (statusErr) {
                        console.error('Error recording status change event:', statusErr);
                    }
                });
            }
            
            // Record the general update in thesis events table
            const eventQuery = `
                INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                VALUES (?, 'Ενημέρωση', ?, NOW(), ?, ?)
            `;
            
            const eventDescription = `Ενημέρωση στοιχείων διπλωματικής: ${title}`;
            
            // Use the current state after update - if status was changed, use the new status, otherwise use current state
            let finalState = currentThesis.state;
            if (status && status !== currentThesis.state) {
                finalState = status; // Status was actually changed
            }
            
            connection.query(eventQuery, [thesisId, eventDescription, finalState, professorId], (eventErr) => {
                if (eventErr) {
                    console.error('Error recording thesis event:', eventErr);
                    // Don't fail the main operation, just log the error
                }
            });
            
            res.json({ 
                success: true,
                message: 'Η διπλωματική ενημερώθηκε επιτυχώς',
                thesisId: thesisId
            });
            });
        }
    });
});

// Get detailed thesis information (UC9)
router.get('/api/professor/thesis-details/:thesisId', (req, res) => {
    const thesisId = req.params.thesisId;
    console.log('thesis-details endpoint called with thesisId:', thesisId);
    
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return; // Error response already sent by helper
    
    console.log('Loading thesis details for professor:', professorId, 'thesis:', thesisId);

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
            DATEDIFF(CURDATE(), tt.time_of_activation) as duration_days,
            (SELECT MIN(te.event_date) 
             FROM thesis_events te 
             WHERE te.thesis_id = tt.thesis_id 
             AND te.event_type = 'Δημιουργία Θέματος'
            ) as created_at
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
            return res.status(404).json({ 
                success: false, 
                message: 'Η διπλωματική δεν βρέθηκε ή δεν έχετε πρόσβαση σε αυτήν' 
            });
        }

        const thesis = thesisResult[0];

        // Get committee information (including supervisor and members)
        const committeeQuery = `
                    SELECT 
                        'supervisor' as role,
                        'accepted' as status,
                        tt.time_of_activation as invitation_date,
                        tt.time_of_activation as acceptance_date,
                        p.professor_id,
                        CONCAT(p.name, ' ', p.surname) as professor_name,
                        p.email
                    FROM thesis_topic tt
                    JOIN professor p ON tt.instructor_id = p.professor_id
                    WHERE tt.thesis_id = ?
                    
                    UNION ALL
                    
                    SELECT 
                        'member' as role,
                        'accepted' as status,
                        COALESCE(tc1.acceptance_date, tt.time_of_activation) as invitation_date,
                        COALESCE(tc1.acceptance_date, tt.time_of_activation) as acceptance_date,
                        p1.professor_id,
                        CONCAT(p1.name, ' ', p1.surname) as professor_name,
                        p1.email
                    FROM thesis_topic tt
                    JOIN professor p1 ON tt.member1 = p1.professor_id
                    LEFT JOIN thesis_committee tc1 ON tc1.thesis_id = tt.thesis_id AND tc1.professor_id = p1.professor_id
                    WHERE tt.thesis_id = ? AND tt.member1 IS NOT NULL
                    
                    UNION ALL
                    
                    SELECT 
                        'member' as role,
                        'accepted' as status,
                        COALESCE(tc2.acceptance_date, tt.time_of_activation) as invitation_date,
                        COALESCE(tc2.acceptance_date, tt.time_of_activation) as acceptance_date,
                        p2.professor_id,
                        CONCAT(p2.name, ' ', p2.surname) as professor_name,
                        p2.email
                    FROM thesis_topic tt
                    JOIN professor p2 ON tt.member2 = p2.professor_id
                    LEFT JOIN thesis_committee tc2 ON tc2.thesis_id = tt.thesis_id AND tc2.professor_id = p2.professor_id
                    WHERE tt.thesis_id = ? AND tt.member2 IS NOT NULL
                    
                    UNION ALL
                    
                    SELECT 
                        tc.role,
                        tc.status,
                        tc.invitation_date,
                        tc.acceptance_date,
                        tc.professor_id,
                        CONCAT(p.name, ' ', p.surname) as professor_name,
                        p.email
                    FROM thesis_committee tc
                    JOIN professor p ON tc.professor_id = p.professor_id
                    JOIN thesis_topic tt ON tc.thesis_id = tt.thesis_id
                    WHERE tc.thesis_id = ? 
                    AND tc.status = 'accepted'
                    AND tc.professor_id != tt.instructor_id  -- Exclude supervisor
                    AND tc.professor_id != COALESCE(tt.member1, -1)  -- Exclude member1 if exists
                    AND tc.professor_id != COALESCE(tt.member2, -1)  -- Exclude member2 if exists
                    ORDER BY 
                        CASE role 
                            WHEN 'supervisor' THEN 1 
                            WHEN 'member' THEN 2 
                            ELSE 3 
                        END,
                        invitation_date
                `;

        connection.query(committeeQuery, [thesisId, thesisId, thesisId, thesisId], (err, committeeResult) => {
            if (err) {
                console.error('Error fetching committee information:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            // Remove duplicates based on professor_id
            const uniqueCommittee = [];
            const seenProfessors = new Set();
            
            for (const member of committeeResult) {
                if (!seenProfessors.has(member.professor_id)) {
                    seenProfessors.add(member.professor_id);
                    uniqueCommittee.push(member);
                }
            }

            // Get thesis timeline/events
            const eventsQuery = `
                SELECT 
                    event_type,
                    description,
                    event_date,
                    status
                FROM thesis_events
                WHERE thesis_id = ?
                ORDER BY event_date DESC
            `;

            connection.query(eventsQuery, [thesisId], (err, eventsResult) => {
                if (err) {
                    console.error('Error fetching thesis events:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                // Get thesis files - handle case where table doesn't exist
                const filesResult = []; // Files from thesis_files table (if it existed)
                
                // Get thesis comments/grades
                const commentsQuery = `
                    SELECT 
                        tc.comment,
                        tc.grade,
                        tc.comment_date,
                        tc.comment_type,
                        p.name as professor_name,
                        p.surname as professor_surname
                    FROM thesis_comments tc
                    JOIN professor p ON tc.professor_id = p.professor_id
                    WHERE tc.thesis_id = ?
                    ORDER BY tc.comment_date DESC
                `;

                connection.query(commentsQuery, [thesisId], (err, commentsResult) => {
                    if (err) {
                        console.error('Error fetching thesis comments:', err);
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }

                    // Determine professor's role in this thesis
                    let myRole = 'other';
                    if (thesis.instructor_id === professorId) {
                        myRole = 'supervisor';
                    } else {
                        // Check if professor is in committee
                        const isCommitteeMember = uniqueCommittee.some(member => 
                            member.professor_id === professorId
                        );
                        if (isCommitteeMember) {
                            myRole = 'member';
                        }
                    }

                    // Combine all data
                    const result = {
                        success: true,
                        data: {
                            id: thesis.thesis_id,
                            code: thesis.thesis_id, // Add thesis code/id for display
                            title: thesis.title,
                            description: thesis.description,
                            status: thesis.state,
                            pdf: thesis.pdf,
                            assignDate: thesis.time_of_activation,
                            created_at: thesis.created_at, // Add creation date
                            assigned_at: thesis.time_of_activation, // Add assignment date
                            duration: thesis.duration_days,
                            protocol_number: thesis.protocol_number || null, // Add protocol number (safe)
                            my_role: myRole,
                            student: thesis.student_name && thesis.student_surname ? {
                                name: `${thesis.student_name} ${thesis.student_surname}`,
                                email: thesis.student_email,
                                phone: thesis.student_phone,
                                studentNumber: thesis.student_number
                            } : null,
                            supervisor: {
                                name: `${thesis.supervisor_name} ${thesis.supervisor_surname}`
                            },
                            committee: uniqueCommittee,
                            timeline: eventsResult,
                            files: filesResult,
                            comments: commentsResult
                        }
                    };

                    res.json(result);
                });
            });
        });
    });
});

// Test endpoint
router.get('/api/professor/test', (req, res) => {
    res.json({ message: 'Test endpoint works!' });
});

// ===== DELETE TOPIC ENDPOINT =====
router.delete('/api/professor/delete-topic', (req, res) => {
    const { topicId } = req.body;
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return; // Error response already sent by helper
    
    if (!topicId) {
        return res.status(400).json({
            success: false,
            message: 'Το ID του θέματος είναι απαραίτητο'
        });
    }
    
    // First check if the topic exists and belongs to this professor
    const checkQuery = `
        SELECT thesis_id, title, state 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ?
    `;
    
    connection.query(checkQuery, [topicId, professorId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking topic:', checkErr);
            return res.status(500).json({
                success: false,
                message: 'Σφάλμα κατά τον έλεγχο του θέματος'
            });
        }
        
        if (checkResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Το θέμα δεν βρέθηκε ή δεν έχετε δικαιώματα διαγραφής'
            });
        }
        
        const topic = checkResults[0];
        
        // Check if topic can be deleted (only if not assigned to a student)
        if (topic.state !== 'Χωρίς Ανάθεση') {
            const stateMessages = {
                'Υπό Ανάθεση': 'το θέμα έχει ανατεθεί σε φοιτητή',
                'Ενεργή': 'η διπλωματική είναι ενεργή',
                'Υπό Εξέταση': 'η διπλωματική είναι υπό εξέταση',
                'Περατωμένη': 'η διπλωματική έχει ολοκληρωθεί',
                'Ακυρωμένη': 'η διπλωματική έχει ακυρωθεί'
            };
            
            const reason = stateMessages[topic.state] || 'το θέμα δεν είναι διαθέσιμο προς διαγραφή';
            
            return res.status(400).json({
                success: false,
                message: `Δεν μπορείτε να διαγράψετε αυτό το θέμα επειδή ${reason}. Μόνο θέματα με κατάσταση "Χωρίς Ανάθεση" μπορούν να διαγραφούν.`
            });
        }
        
        // Delete the topic and all related records in a transaction
        connection.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction error:', transErr);
                return res.status(500).json({
                    success: false,
                    message: 'Σφάλμα κατά την έναρξη της διαγραφής'
                });
            }
            
            // Delete related records first (foreign key constraints)
            const deleteRelatedQueries = [
                { query: 'DELETE FROM thesis_committee WHERE thesis_id = ?', name: 'committee' },
                { query: 'DELETE FROM thesis_events WHERE thesis_id = ?', name: 'events' },
                { query: 'DELETE FROM thesis_files WHERE thesis_id = ?', name: 'files' },
                { query: 'DELETE FROM thesis_comments WHERE thesis_id = ?', name: 'comments' },
                { query: 'DELETE FROM announcements WHERE thesis_id = ?', name: 'announcements' }
            ];
            
            let completed = 0;
            let hasError = false;
            
            const executeNext = () => {
                if (hasError) return;
                
                if (completed >= deleteRelatedQueries.length) {
                    // All related records deleted, now delete the main topic
                    const deleteTopicQuery = 'DELETE FROM thesis_topic WHERE thesis_id = ? AND instructor_id = ?';
                    
                    connection.query(deleteTopicQuery, [topicId, professorId], (deleteTopicErr) => {
                        if (deleteTopicErr) {
                            hasError = true;
                            console.error('Error deleting topic:', deleteTopicErr);
                            return connection.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Σφάλμα κατά τη διαγραφή του θέματος'
                                });
                            });
                        }
                        
                        // Commit transaction
                        connection.commit((commitErr) => {
                            if (commitErr) {
                                console.error('Commit error:', commitErr);
                                return connection.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: 'Σφάλμα κατά την επικύρωση της διαγραφής'
                                    });
                                });
                            }
                            
                            console.log('Topic deleted successfully:', topicId);
                            res.json({
                                success: true,
                                message: `Το θέμα "${topic.title}" διαγράφηκε επιτυχώς`
                            });
                        });
                    });
                    return;
                }
                
                const currentQuery = deleteRelatedQueries[completed];
                connection.query(currentQuery.query, [topicId], (err) => {
                    if (err) {
                        hasError = true;
                        console.error(`Error deleting ${currentQuery.name}:`, err);
                        return connection.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: `Σφάλμα κατά τη διαγραφή σχετικών εγγραφών (${currentQuery.name})`
                            });
                        });
                    }
                    
                    completed++;
                    executeNext();
                });
            };
            
            executeNext();
        });
    });
});

// ===== UC12: VIEW INSTRUCTOR STATISTICS =====
router.get('/api/professor/statistics', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Μη εξουσιοδοτημένη πρόσβαση' 
        });
    }
    
    const professorId = req.session.user.id;
    console.log('Statistics request - Professor ID:', professorId);

    // Parallel queries to get comprehensive statistics
    const queries = {
        // Basic counts by status
        statusStats: `
            SELECT 
                state as status,
                COUNT(*) as count
            FROM thesis_topic 
            WHERE instructor_id = ? OR thesis_id IN (
                SELECT thesis_id FROM thesis_committee 
                WHERE professor_id = ?
            )
            GROUP BY state
        `,
        
        // Monthly thesis creation trend (last 12 months)
        monthlyTrend: `
            SELECT 
                DATE_FORMAT(date_created, '%Y-%m') as month,
                COUNT(*) as count
            FROM (
                SELECT DATE_SUB(CURDATE(), INTERVAL n MONTH) as date_created
                FROM (
                    SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION 
                    SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION 
                    SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
                ) nums
            ) months
            LEFT JOIN thesis_topic t ON DATE_FORMAT(t.time_of_activation, '%Y-%m') = DATE_FORMAT(months.date_created, '%Y-%m')
                AND t.instructor_id = ?
                AND t.time_of_activation IS NOT NULL
            GROUP BY DATE_FORMAT(date_created, '%Y-%m')
            ORDER BY month ASC
        `,
        
        // Role distribution
        roleDistribution: `
            SELECT 
                'supervisor' as role,
                COUNT(*) as count
            FROM thesis_topic 
            WHERE instructor_id = ?
            
            UNION ALL
            
            SELECT 
                'committee_member' as role,
                COUNT(*) as count
            FROM thesis_committee tc
            JOIN thesis_topic t ON tc.thesis_id = t.thesis_id
            WHERE tc.professor_id = ? AND t.instructor_id != ?
        `,
        
        // Average completion time for completed theses
        completionStats: `
            SELECT 
                COUNT(CASE WHEN state = 'Περατωμένη' THEN 1 END) as completed_count,
                COUNT(CASE WHEN state = 'Ενεργή' THEN 1 END) as active_count,
                COUNT(CASE WHEN state = 'Υπό Εξέταση' THEN 1 END) as under_examination_count,
                COUNT(CASE WHEN state = 'Υπό Ανάθεση' THEN 1 END) as under_assignment_count,
                COUNT(CASE WHEN state = 'Χωρίς Ανάθεση' THEN 1 END) as unassigned_count,
                COUNT(CASE WHEN state = 'Ακυρωμένη' THEN 1 END) as cancelled_count
            FROM thesis_topic 
            WHERE instructor_id = ?
        `,
        
        // Student performance stats
        studentStats: `
            SELECT 
                COUNT(DISTINCT s.student_number) as total_students,
                COUNT(CASE WHEN t.state = 'Περατωμένη' THEN 1 END) as successful_students,
                COUNT(CASE WHEN t.state = 'Ενεργή' THEN 1 END) as current_students,
                COUNT(CASE WHEN t.state = 'Ακυρωμένη' THEN 1 END) as cancelled_students
            FROM thesis_topic t
            LEFT JOIN student s ON t.student_id = s.student_number
            WHERE t.instructor_id = ? AND t.student_id IS NOT NULL
        `,
        
        // Recent activity (last 30 days)
        recentActivity: `
            SELECT 
                DATE(time_of_activation) as date,
                title,
                state as status,
                'assigned' as activity_type
            FROM thesis_topic 
            WHERE instructor_id = ? 
                AND time_of_activation >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND time_of_activation IS NOT NULL
                
            ORDER BY date DESC
            LIMIT 10
        `
    };

    // Execute all queries in parallel
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    const executeQuery = (key, query, params) => {
        connection.query(query, params, (err, rows) => {
            if (err) {
                console.error(`Error in ${key} query:`, err);
                results[key] = [];
            } else {
                results[key] = rows;
            }
            
            completed++;
            if (completed === totalQueries) {
                // Process and send results
                processStatistics();
            }
        });
    };

    const processStatistics = () => {
        // Process status statistics - map Greek states to English keys
        const statusCounts = {
            'unassigned': 0,
            'under_assignment': 0,
            'active': 0,
            'under_examination': 0,
            'completed': 0,
            'cancelled': 0
        };

        const greekToEnglishStatus = {
            'Χωρίς Ανάθεση': 'unassigned',
            'Υπό Ανάθεση': 'under_assignment',
            'Ενεργή': 'active',
            'Υπό Εξέταση': 'under_examination',
            'Περατωμένη': 'completed',
            'Ακυρωμένη': 'cancelled'
        };

        results.statusStats.forEach(row => {
            const englishStatus = greekToEnglishStatus[row.status];
            if (englishStatus) {
                statusCounts[englishStatus] = row.count;
            }
        });

        // Calculate totals
        const totalTheses = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
        
        // Process monthly trend data
        const monthlyData = results.monthlyTrend.map(row => ({
            month: row.month,
            count: row.count,
            label: formatMonthLabel(row.month)
        }));

        // Process role distribution
        const roleStats = {
            supervisor: 0,
            committee_member: 0
        };
        
        results.roleDistribution.forEach(row => {
            if (row.role) {
                roleStats[row.role] = row.count;
            }
        });

        // Process completion statistics
        const completion = results.completionStats[0] || {};
        
        // Calculate thesis completion rate based on completed vs total assigned theses
        const totalAssignedTheses = (completion.completed_count || 0) + 
                                  (completion.active_count || 0) + 
                                  (completion.under_examination_count || 0) + 
                                  (completion.cancelled_count || 0);
        
        const thesisCompletionRate = totalAssignedTheses > 0 ? 
            ((completion.completed_count || 0) / totalAssignedTheses * 100).toFixed(1) : 0;

        // Process student statistics
        const studentData = results.studentStats[0] || {};
        
        // Calculate student success rate
        const studentSuccessRate = studentData.total_students > 0 ? 
            ((studentData.successful_students / studentData.total_students) * 100).toFixed(1) : 0;

        // Prepare final response
        const statistics = {
            overview: {
                totalTheses,
                statusDistribution: statusCounts,
                roleDistribution: roleStats
            },
            performance: {
                completionRate: parseFloat(thesisCompletionRate),
                activeTheses: completion.active_count || 0,
                underExaminationTheses: completion.under_examination_count || 0,
                completedTheses: completion.completed_count || 0
            },
            students: {
                totalStudents: studentData.total_students || 0,
                successfulStudents: studentData.successful_students || 0,
                currentStudents: studentData.current_students || 0,
                cancelledStudents: studentData.cancelled_students || 0,
                successRate: parseFloat(studentSuccessRate)
            },
            trends: {
                monthlyCreation: monthlyData
            },
            recentActivity: results.recentActivity.map(activity => ({
                ...activity,
                date: formatDate(activity.date),
                statusLabel: getStatusLabel(activity.status)
            }))
        };

        res.json({
            success: true,
            data: statistics,
            timestamp: new Date().toISOString()
        });
    };

    // Helper functions
    const formatMonthLabel = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const monthNames = [
            'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν',
            'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('el-GR');
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            'Χωρίς Ανάθεση': 'Χωρίς Ανάθεση',
            'Υπό Ανάθεση': 'Υπό Ανάθεση',
            'Ενεργή': 'Ενεργή',
            'Υπό Εξέταση': 'Υπό Εξέταση',
            'Περατωμένη': 'Ολοκληρωμένη',
            'Ακυρωμένη': 'Ακυρωμένη'
        };
        return statusLabels[status] || status;
    };

    // Execute all queries
    executeQuery('statusStats', queries.statusStats, [professorId, professorId]);
    executeQuery('monthlyTrend', queries.monthlyTrend, [professorId]);
    executeQuery('roleDistribution', queries.roleDistribution, [professorId, professorId, professorId]);
    executeQuery('completionStats', queries.completionStats, [professorId]);
    executeQuery('studentStats', queries.studentStats, [professorId]);
    executeQuery('recentActivity', queries.recentActivity, [professorId]);
});

// ===== UC11: COMMITTEE INVITATIONS ENDPOINTS =====

// Get committee invitations for the logged-in professor
router.get('/api/professor/committee-invitations', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return; // Error response already sent by helper
    
    // Query to get all committee invitations for this professor
    const query = `
        SELECT 
            tc.id,
            tc.thesis_id,
            tc.role,
            tc.invitation_date,
            tc.acceptance_date,
            tc.status,
            tt.title as thesis_title,
            tt.description as thesis_description,
            s.name as student_name,
            s.student_number as student_id,
            p.name as supervisor_name
        FROM thesis_committee tc
        JOIN thesis_topic tt ON tc.thesis_id = tt.thesis_id
        LEFT JOIN student s ON tt.student_id = s.student_number
        JOIN professor p ON tt.instructor_id = p.professor_id
        WHERE tc.professor_id = ?
        ORDER BY 
            CASE tc.status 
                WHEN 'pending' THEN 1 
                WHEN 'accepted' THEN 2 
                WHEN 'declined' THEN 3 
            END,
            tc.invitation_date DESC
    `;
    
    connection.query(query, [professorId], (err, invitations) => {
        if (err) {
            console.error('Error fetching committee invitations:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Calculate summary statistics
        const summary = {
            total: invitations.length,
            pending: invitations.filter(inv => inv.status === 'pending').length,
            accepted: invitations.filter(inv => inv.status === 'accepted').length,
            declined: invitations.filter(inv => inv.status === 'declined').length
        };
        
        res.json({ 
            success: true, 
            invitations: invitations,
            summary: summary
        });
    });
});

// Respond to a committee invitation
router.post('/api/professor/committee-invitations/respond', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return; // Error response already sent by helper
    
    const { invitation_id, response } = req.body;
    
    if (!invitation_id || !response) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    if (!['accepted', 'declined'].includes(response)) {
        return res.status(400).json({ success: false, message: 'Invalid response' });
    }
    
    // First, verify that this invitation belongs to the logged-in professor and is pending
    const verifyQuery = `
        SELECT id, thesis_id, role, status 
        FROM thesis_committee 
        WHERE id = ? AND professor_id = ? AND status = 'pending'
    `;
    
    connection.query(verifyQuery, [invitation_id, professorId], (err, results) => {
        if (err) {
            console.error('Error verifying invitation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invitation not found or already responded to' 
            });
        }
        
        const invitation = results[0];
        
        console.log(`DEBUG: Invitation details - ID: ${invitation.id}, Role: '${invitation.role}', Status: '${invitation.status}', Professor ID: ${professorId}`);
        
        // Update the invitation status
        const updateQuery = `
            UPDATE thesis_committee 
            SET status = ?, acceptance_date = NOW() 
            WHERE id = ?
        `;
        
        connection.query(updateQuery, [response, invitation_id], (err, updateResult) => {
            if (err) {
                console.error('Error updating invitation:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Invitation not found' 
                });
            }
            
            const responseText = response === 'accepted' ? 'αποδεκτή' : 'απορριφθείσα';
            
            // Function to handle thesis_topic synchronization
            const syncThesisTopic = (callback) => {
                console.log(`DEBUG: response = '${response}', invitation.role = '${invitation.role}'`);
                console.log(`DEBUG: Condition check: response === 'accepted' = ${response === 'accepted'}, invitation.role === 'member' = ${invitation.role === 'member'}`);
                
                if (response === 'accepted' && invitation.role === 'member') {
                    console.log('DEBUG: Entering thesis_topic sync for accepted member');
                    // Get current thesis_topic data to check member slots
                    const getThesisQuery = `
                        SELECT instructor_id, member1, member2 
                        FROM thesis_topic 
                        WHERE thesis_id = ?
                    `;
                    
                    connection.query(getThesisQuery, [invitation.thesis_id], (err, thesisResults) => {
                        if (err) {
                            console.error('Error getting thesis data:', err);
                            return callback(err);
                        }
                        
                        if (thesisResults.length === 0) {
                            console.error('Thesis not found for ID:', invitation.thesis_id);
                            return callback(new Error('Thesis not found'));
                        }
                        
                        const thesis = thesisResults[0];
                        
                        // Don't add supervisor as committee member
                        if (professorId === thesis.instructor_id) {
                            console.log('Supervisor cannot be added as committee member');
                            return callback();
                        }
                        
                        // Determine which member slot to fill
                        let updateThesisQuery = '';
                        let updateParams = [];
                        
                        if (!thesis.member1) {
                            updateThesisQuery = 'UPDATE thesis_topic SET member1 = ? WHERE thesis_id = ?';
                            updateParams = [professorId, invitation.thesis_id];
                        } else if (!thesis.member2) {
                            updateThesisQuery = 'UPDATE thesis_topic SET member2 = ? WHERE thesis_id = ?';
                            updateParams = [professorId, invitation.thesis_id];
                        } else {
                            console.log('All committee member slots are already filled');
                            return callback();
                        }
                        
                        // Update thesis_topic with new committee member
                        connection.query(updateThesisQuery, updateParams, (err, updateResult) => {
                            if (err) {
                                console.error('Error updating thesis_topic:', err);
                                return callback(err);
                            }
                            
                            console.log(`Successfully added professor ${professorId} to thesis ${invitation.thesis_id} committee`);
                            callback();
                        });
                    });
                } else if (response === 'declined' && invitation.role === 'member') {
                    // Remove professor from thesis_topic if they declined
                    const removeFromThesisQuery = `
                        UPDATE thesis_topic 
                        SET member1 = CASE 
                                        WHEN member1 = ? THEN NULL 
                                        ELSE member1 
                                      END,
                            member2 = CASE 
                                        WHEN member2 = ? THEN NULL 
                                        ELSE member2 
                                      END
                        WHERE thesis_id = ?
                    `;
                    
                    connection.query(removeFromThesisQuery, [professorId, professorId, invitation.thesis_id], (err, updateResult) => {
                        if (err) {
                            console.error('Error removing professor from thesis_topic:', err);
                            return callback(err);
                        }
                        
                        console.log(`Successfully removed professor ${professorId} from thesis ${invitation.thesis_id} committee`);
                        callback();
                    });
                } else {
                    // No thesis_topic update needed
                    callback();
                }
            };
            
            // Sync thesis_topic table
            syncThesisTopic((syncErr) => {
                if (syncErr) {
                    console.error('Error syncing thesis_topic:', syncErr);
                    // Continue with the response even if sync failed
                }
                
                // Get current thesis state for the event
                const getThesisStateQuery = 'SELECT state FROM thesis_topic WHERE thesis_id = ?';
                connection.query(getThesisStateQuery, [invitation.thesis_id], (stateErr, stateResult) => {
                    let currentState = 'Υπό Ανάθεση'; // default fallback
                    if (!stateErr && stateResult.length > 0) {
                        currentState = stateResult[0].state;
                    }
                
                    // Log the committee response event with current state
                    const eventQuery = `
                        INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                        VALUES (?, 'Απόκριση Τριμελούς', ?, NOW(), ?, ?)
                    `;
                    
                    const eventDescription = `Μέλος τριμελούς επιτροπής: Πρόσκληση ${responseText}`;
                    
                    connection.query(eventQuery, [invitation.thesis_id, eventDescription, currentState, professorId], (eventErr) => {
                        if (eventErr) {
                            console.error('Error recording committee response event:', eventErr);
                        }
                    });
                });
                
                // If invitation was accepted, check if we now have complete committee to make thesis active
                if (response === 'accepted') {
                    const checkCommitteeQuery = `
                        SELECT 
                            COUNT(tc.id) as accepted_count,
                            tt.member1,
                            tt.member2
                        FROM thesis_topic tt
                        LEFT JOIN thesis_committee tc ON tt.thesis_id = tc.thesis_id 
                            AND tc.status = 'accepted' AND tc.role = 'member'
                        WHERE tt.thesis_id = ?
                        GROUP BY tt.thesis_id, tt.member1, tt.member2
                    `;
                    
                    connection.query(checkCommitteeQuery, [invitation.thesis_id], (err, countResult) => {
                        if (err) {
                            console.error('Error checking committee status:', err);
                            // Don't fail the main operation
                            return;
                        }
                        
                        if (countResult.length === 0) {
                            console.log('No committee data found for thesis', invitation.thesis_id);
                            return;
                        }
                        
                        const result = countResult[0];
                        const acceptedCount = result.accepted_count;
                        const member1Filled = result.member1 !== null;
                        const member2Filled = result.member2 !== null;
                        
                        // Committee is complete when we have exactly 2 accepted members AND both member slots are filled
                        if (acceptedCount === 2 && member1Filled && member2Filled) {
                            const activateQuery = `
                                UPDATE thesis_topic 
                                SET state = 'Ενεργή', time_of_activation = NOW() 
                                WHERE thesis_id = ? AND state = 'Υπό Ανάθεση'
                            `;
                            
                            connection.query(activateQuery, [invitation.thesis_id], (err, activateResult) => {
                                if (err) {
                                    console.error('Error activating thesis:', err);
                                    return;
                                }
                                
                                if (activateResult.affectedRows > 0) {
                                    // Clean up pending invitations since committee is complete
                                    const cleanupQuery = `
                                        DELETE FROM thesis_committee 
                                        WHERE thesis_id = ? AND status = 'pending' AND role = 'member'
                                    `;
                                    
                                    connection.query(cleanupQuery, [invitation.thesis_id], (cleanupErr, cleanupResult) => {
                                        if (cleanupErr) {
                                            console.error('Error cleaning up pending invitations:', cleanupErr);
                                        } else if (cleanupResult.affectedRows > 0) {
                                            console.log(`Cleaned up ${cleanupResult.affectedRows} pending invitations for thesis ${invitation.thesis_id}`);
                                            
                                            // Log the cleanup event
                                            const cleanupEventQuery = `
                                                INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                                                VALUES (?, 'Καθαρισμός Προσκλήσεων', ?, NOW(), 'Ενεργή', ?)
                                            `;
                                            
                                            const cleanupDescription = `Διαγραφή ${cleanupResult.affectedRows} pending προσκλήσεων - συμπληρώθηκε η τριμελής επιτροπή`;
                                            
                                            connection.query(cleanupEventQuery, [invitation.thesis_id, cleanupDescription, professorId], (eventErr) => {
                                                if (eventErr) {
                                                    console.error('Error recording cleanup event:', eventErr);
                                                }
                                            });
                                        }
                                    });
                                    
                                    // Log the activation event
                                    const activateEventQuery = `
                                        INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                                        VALUES (?, 'Ενεργοποίηση', ?, NOW(), 'Ενεργή', ?)
                                    `;
                                    
                                    const activateDescription = `Η διπλωματική ενεργοποιήθηκε - Συμπληρώθηκε η τριμελής επιτροπή`;
                                    
                                    connection.query(activateEventQuery, [invitation.thesis_id, activateDescription, professorId], (eventErr) => {
                                        if (eventErr) {
                                            console.error('Error recording activation event:', eventErr);
                                        }
                                    });
                                    
                                    console.log(`Thesis ${invitation.thesis_id} activated - committee complete`);
                                }
                            });
                        }
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: `Η πρόσκληση έγινε ${responseText} επιτυχώς`,
                    invitation_id: invitation_id,
                    status: response
                });
            });
        });
    });
});

// ===== PRESENTATION DETAILS ENDPOINT =====
// GET route για τα στοιχεία παρουσίασης διπλωματικής
router.get('/thesis/:thesis_id/presentation-details', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return;

    const { thesis_id } = req.params;

    // Έλεγχος ότι ο καθηγητής είναι supervisor της διπλωματικής
    const supervisorCheckQuery = `
        SELECT instructor_id 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Υπό Εξέταση'
    `;

    connection.query(supervisorCheckQuery, [thesis_id, professorId], (err, supervisorResults) => {
        if (err) {
            console.error('Error checking supervisor:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error',
                details: err.message 
            });
        }

        if (supervisorResults.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Δεν έχετε δικαίωμα προβολής. Μόνο ο επιβλέπων καθηγητής μπορεί να δει τα στοιχεία παρουσίασης.' 
            });
        }

        // Έλεγχος ότι υπάρχουν στοιχεία παρουσίασης
        const presentationCheckQuery = `
            SELECT a.*, tt.title as thesis_title, tt.student_id, tt.instructor_id, tt.member1, tt.member2
            FROM announcements a
            JOIN thesis_topic tt ON a.thesis_id = tt.thesis_id
            WHERE a.thesis_id = ? AND a.date IS NOT NULL AND a.time IS NOT NULL 
                AND a.type IS NOT NULL AND a.location_or_link IS NOT NULL
        `;

        connection.query(presentationCheckQuery, [thesis_id], (err, presentationResults) => {
            if (err) {
                console.error('Error checking presentation details:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error',
                    details: err.message 
                });
            }

            if (presentationResults.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Δεν υπάρχουν πλήρη στοιχεία παρουσίασης. Ο φοιτητής πρέπει να συμπληρώσει όλες τις απαραίτητες λεπτομέρειες (ημερομηνία, ώρα, τρόπος, τοποθεσία).' 
                });
            }

            const presentation = presentationResults[0];

            // Λήψη στοιχείων φοιτητή
            const studentQuery = 'SELECT name, surname FROM users WHERE user_id = ?';
            connection.query(studentQuery, [presentation.student_id], (err, studentResults) => {
                if (err) {
                    console.error('Error fetching student:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                // Λήψη στοιχείων επιτροπής
                const committeeIds = [presentation.instructor_id, presentation.member1, presentation.member2].filter(id => id);
                const committeeQuery = 'SELECT id, name, surname FROM users WHERE id IN (?)';
                
                connection.query(committeeQuery, [committeeIds], (err, committeeResults) => {
                    if (err) {
                        console.error('Error fetching committee:', err);
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Internal server error',
                            details: err.message 
                        });
                    }

                    // Οργάνωση δεδομένων επιτροπής
                    const supervisor = committeeResults.find(member => member.id === presentation.instructor_id);
                    const members = committeeResults.map(member => ({
                        ...member,
                        role: member.id === presentation.instructor_id ? 'supervisor' : 'member'
                    }));

                    const responseData = {
                        thesis: {
                            id: presentation.thesis_id,
                            title: presentation.thesis_title
                        },
                        student: studentResults[0],
                        supervisor: supervisor,
                        committee_members: members,
                        announcement: {
                            date: presentation.date,
                            time: presentation.time,
                            type: presentation.type,
                            location_or_link: presentation.location_or_link,
                            state: presentation.state || 'waiting'
                        },
                        presentation: {
                            date: presentation.date,
                            time: presentation.time,
                            type: presentation.type,
                            location_or_link: presentation.location_or_link
                        }
                    };

                    res.json({
                        success: true,
                        data: responseData
                    });
                });
            });
        });
    });
});

// Get announcement for editing (allows incomplete data)
router.get('/professor/thesis/:thesis_id/announcement', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return;

    const { thesis_id } = req.params;

    // Check if professor is supervisor
    const supervisorCheckQuery = `
        SELECT instructor_id 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Υπό Εξέταση'
    `;

    connection.query(supervisorCheckQuery, [thesis_id, professorId], (err, supervisorResults) => {
        if (err) {
            console.error('Error checking supervisor:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }

        if (supervisorResults.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Δεν έχετε δικαίωμα επεξεργασίας' 
            });
        }

        // Get announcement data (even if incomplete)
        const announcementQuery = `
            SELECT * FROM announcements WHERE thesis_id = ?
        `;

        connection.query(announcementQuery, [thesis_id], (err, announcementResults) => {
            if (err) {
                console.error('Error fetching announcement:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }

            if (announcementResults.length === 0) {
                return res.json({
                    success: true,
                    announcement: null
                });
            }

            res.json({
                success: true,
                announcement: announcementResults[0]
            });
        });
    });
});

// Frontend compatibility routes with /professor prefix
router.get('/professor/thesis/:thesis_id/presentation-details', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return;

    const { thesis_id } = req.params;

    // Έλεγχος ότι ο καθηγητής είναι supervisor της διπλωματικής
    const supervisorCheckQuery = `
        SELECT instructor_id 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Υπό Εξέταση'
    `;

    connection.query(supervisorCheckQuery, [thesis_id, professorId], (err, supervisorResults) => {
        if (err) {
            console.error('Error checking supervisor:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }

        if (supervisorResults.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Δεν έχετε δικαίωμα επεξεργασίας' 
            });
        }

        // Get announcement data (even if incomplete)
        const announcementQuery = `
            SELECT * FROM announcements WHERE thesis_id = ?
        `;

        connection.query(announcementQuery, [thesis_id], (err, announcementResults) => {
            if (err) {
                console.error('Error fetching announcement:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }

            if (announcementResults.length === 0) {
                return res.json({
                    success: true,
                    announcement: null
                });
            }

            res.json({
                success: true,
                announcement: announcementResults[0]
            });
        });
    });
});

// POST endpoint for professor frontend compatibility
router.post('/professor/thesis/:thesis_id/announcement', (req, res) => {
    const professorId = getAuthenticatedProfessorId(req, res);
    if (!professorId) return;

    const { thesis_id } = req.params;
    const { date, time, type, location_or_link, action } = req.body;

    // Validation
    if (!date || !time || !type || !location_or_link) {
        return res.status(400).json({
            success: false,
            error: 'Όλα τα στοιχεία παρουσίασης είναι υποχρεωτικά'
        });
    }

    // Έλεγχος ότι ο καθηγητής είναι supervisor της διπλωματικής
    const supervisorCheckQuery = `
        SELECT instructor_id 
        FROM thesis_topic 
        WHERE thesis_id = ? AND instructor_id = ? AND state = 'Υπό Εξέταση'
    `;

    connection.query(supervisorCheckQuery, [thesis_id, professorId], (err, supervisorResults) => {
        if (err) {
            console.error('Error checking supervisor:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }

        if (supervisorResults.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Δεν έχετε δικαίωμα επεξεργασίας. Μόνο ο επιβλέπων καθηγητής μπορεί να επεξεργαστεί την ανακοίνωση.' 
            });
        }

        // Determine state based on action
        const state = (action === 'publish') ? 'uploaded' : 'waiting';

        // Check if announcement already exists
        const checkQuery = 'SELECT id FROM announcements WHERE thesis_id = ?';
        
        connection.query(checkQuery, [thesis_id], (err, existingResults) => {
            if (err) {
                console.error('Error checking existing announcement:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }

            let query, params;
            if (existingResults.length > 0) {
                // Update existing announcement
                query = `
                    UPDATE announcements 
                    SET date = ?, time = ?, type = ?, location_or_link = ?, state = ?, updated_at = NOW()
                    WHERE thesis_id = ?
                `;
                params = [date, time, type, location_or_link, state, thesis_id];
            } else {
                // Insert new announcement
                query = `
                    INSERT INTO announcements (thesis_id, date, time, type, location_or_link, state, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                params = [thesis_id, date, time, type, location_or_link, state];
            }

            connection.query(query, params, (err, result) => {
                if (err) {
                    console.error('Error saving announcement:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Σφάλμα κατά την αποθήκευση της ανακοίνωσης' 
                    });
                }

                // Record the event
                const eventQuery = `
                    INSERT INTO thesis_events (thesis_id, event_type, description, event_date, status, created_by)
                    VALUES (?, ?, ?, NOW(), ?, ?)
                `;
                
                const eventType = state === 'uploaded' ? 'Δημοσίευση Ανακοίνωσης' : 'Αποθήκευση Ανακοίνωσης';
                const eventDescription = state === 'uploaded' ? 
                    'Δημοσιεύτηκε η ανακοίνωση παρουσίασης διπλωματικής' : 
                    'Αποθηκεύτηκε προσωρινά η ανακοίνωση παρουσίασης διπλωματικής';
                
                connection.query(eventQuery, [thesis_id, eventType, eventDescription, state, professorId], (eventErr) => {
                    if (eventErr) {
                        console.error('Error recording announcement event:', eventErr);
                        // Don't fail the main operation
                    }
                });

                res.json({
                    success: true,
                    message: state === 'uploaded' ? 
                        'Η ανακοίνωση δημοσιεύτηκε επιτυχώς!' : 
                        'Η ανακοίνωση αποθηκεύτηκε επιτυχώς!',
                    state: state
                });
            });
        });
    });
});

module.exports = router;