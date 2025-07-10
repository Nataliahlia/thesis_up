-- Test data for UC7: Cancel Initial Topic Assignment

-- Clear existing data
DELETE FROM thesis_topic WHERE instructor_id = 1;
DELETE FROM student WHERE student_number IN (1001, 1002, 1003);
DELETE FROM professor WHERE professor_id = 1;

-- Add test professor
INSERT INTO professor (professor_id, email, password_hash, name, surname, topic, department, university, landline, mobile) VALUES
(1, 'prof001@ac.upatras.gr', '$2b$10$example', 'Γιάννης', 'Παπαδόπουλος', 'Πληροφορική', 'Τμήμα Μηχανικών Η/Υ', 'Πανεπιστήμιο Πατρών', '2610123456', '6912345678');

-- Add test students
INSERT INTO student (student_number, email, password_hash, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone) VALUES
(1001, 'up1001@ac.upatras.gr', '$2b$10$example', 'Άννα', 'Γεωργίου', 'Κολοκοτρώνη', '15', 'Πάτρα', 26500, 'Κώστας', '2610111111', '6901234567'),
(1002, 'up1002@ac.upatras.gr', '$2b$10$example', 'Κώστας', 'Νικολάου', 'Αγίου Ανδρέου', '23', 'Πάτρα', 26500, 'Μιχάλης', '2610222222', '6901234568'),
(1003, 'up1003@ac.upatras.gr', '$2b$10$example', 'Ελένη', 'Μιχαήλ', 'Κορίνθου', '45', 'Πάτρα', 26500, 'Νίκος', '2610333333', '6901234569');

-- Add sample thesis topics
INSERT INTO thesis_topic (title, description, instructor_id, state) VALUES
('Ανάπτυξη Web Application για E-commerce', 
 'Δημιουργία πλήρους εφαρμογής ηλεκτρονικού εμπορίου με σύγχρονες τεχνολογίες web.', 
 1, 'Χωρίς Ανάθεση'),

('Σύστημα Διαχείρισης Βιβλιοθήκης', 
 'Ανάπτυξη συστήματος διαχείρισης βιβλιοθήκης με web interface.', 
 1, 'Χωρίς Ανάθεση'),

('Machine Learning για Πρόβλεψη Τιμών', 
 'Υλοποίηση αλγορίθμων μηχανικής μάθησης για πρόβλεψη τιμών χρηματιστηρίου.', 
 1, 'Υπό Ανάθεση');

-- Assign the third topic to a student (this will show the cancel button)
UPDATE thesis_topic 
SET student_id = 1001, time_of_activation = NOW()
WHERE title = 'Machine Learning για Πρόβλεψη Τιμών' AND instructor_id = 1;

SELECT 'Sample data inserted successfully!' as message;
