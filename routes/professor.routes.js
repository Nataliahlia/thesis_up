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

// ===== DASHBOARD PAGE ROUTE =====
router.get('/professor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../thesis_up', 'dashboards', 'dashboardProfessor.html'));
});

router.get('/dashboards/dashboardProfessor', (req, res) => {
    res.sendFile(path.join(__dirname, '../thesis_up', 'dashboards', 'dashboardProfessor.html'));
});

// ===== API ROUTES =====

// Get professor's available topics for assignment
router.get('/api/professor/available-topics', (req, res) => {
    const professorId = 1; // Mock professor ID for testing
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

// Search students for topic assignment
router.get('/api/professor/search-students', (req, res) => {
    const searchTerm = req.query.term;
    
    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }
    
    const query = `
        SELECT student_number, name, surname, email 
        FROM student 
        WHERE student_number LIKE ? OR name LIKE ? OR surname LIKE ? OR email LIKE ?
        ORDER BY student_number
        LIMIT 10
    `;
    
    const searchPattern = `%${searchTerm}%`;
    connection.query(query, [searchPattern, searchPattern, searchPattern, searchPattern], (err, results) => {
        if (err) {
            console.error('Error searching students:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get professor's theses (as supervisor or committee member)
router.get('/api/professor/my-theses', (req, res) => {
    const professorId = 1; // Mock professor ID for testing
    const query = `
        SELECT 
            t.thesis_id as id,
            t.title,
            s.name as student_name,
            s.surname as student_surname,
            s.student_number as studentId,
            t.state as status,
            CASE 
                WHEN t.instructor_id = ? THEN 'supervisor'
                WHEN t.member1 = ? OR t.member2 = ? THEN 'member'
                ELSE 'other'
            END as role,
            t.time_of_activation as assignDate,
            DATEDIFF(NOW(), t.time_of_activation) as duration,
            t.pdf as pdfFile
        FROM thesis_topic t
        LEFT JOIN student s ON t.student_id = s.student_number
        WHERE t.instructor_id = ? OR t.member1 = ? OR t.member2 = ?
        ORDER BY t.time_of_activation DESC
    `;
    
    connection.query(query, [professorId, professorId, professorId, professorId, professorId, professorId], (err, results) => {
        if (err) {
            console.error('Error fetching professor theses:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Transform the data for frontend
        const transformedResults = results.map(thesis => ({
            ...thesis,
            student: thesis.student_name && thesis.student_surname ? 
                `${thesis.student_name} ${thesis.student_surname}` : 'Μη ανατεθειμένη',
            assignDate: thesis.assignDate ? thesis.assignDate.toISOString().split('T')[0] : null,
            duration: thesis.duration || 0
        }));
        
        res.json(transformedResults);
    });
});

// Create new thesis topic
router.post('/api/professor/create-topic', uploadPDF.single('pdf'), (req, res) => {
    const { title, description } = req.body;
    const pdfPath = req.file ? req.file.filename : null;
    const professorId = 1; // Mock professor ID for testing
    
    // Validation
    if (!title || !description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Τίτλος και περιγραφή είναι υποχρεωτικά' 
        });
    }
    
    if (title.length > 255) {
        return res.status(400).json({ 
            success: false, 
            message: 'Ο τίτλος δεν πρέπει να υπερβαίνει τους 255 χαρακτήρες' 
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
        
        console.log(`Professor ${professorId} created new topic: "${title}"`);
        res.json({ success: true, topicId: result.insertId });
    });
});

// Assign topic to student
router.post('/api/professor/assign-topic', (req, res) => {
    const { topicId, studentId } = req.body;
    const professorId = 1; // Mock professor ID for testing
    
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
                
                console.log(`Professor ${professorId} assigned topic ${topicId} to student ${studentId}`);
                res.json({ success: true });
            });
        });
    });
});

module.exports = router;
