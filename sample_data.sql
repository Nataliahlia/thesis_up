-- Sample data for testing professor functionality

-- Add sample professors
INSERT INTO professor (professor_id, name, surname, email, office, phone) VALUES
(1, 'Γιάννης', 'Παπαδόπουλος', 'gpapadopoulos@upatras.gr', 'Κτίριο Β, Γραφείο 201', '2610-996801'),
(2, 'Μαρία', 'Κωνσταντίνου', 'mkonstantinou@upatras.gr', 'Κτίριο Γ, Γραφείο 305', '2610-996802'),
(3, 'Δημήτρης', 'Αντωνίου', 'dantoniou@upatras.gr', 'Κτίριο Α, Γραφείο 102', '2610-996803');

-- Add sample students
INSERT INTO student (student_number, name, surname, email, phone, semester) VALUES
('1001', 'Άννα', 'Γεωργίου', 'anna.georgiou@student.upatras.gr', '6901234567', 8),
('1002', 'Κώστας', 'Νικολάου', 'kostas.nikolaou@student.upatras.gr', '6901234568', 7),
('1003', 'Ελένη', 'Μιχαήλ', 'eleni.michail@student.upatras.gr', '6901234569', 8),
('1004', 'Πέτρος', 'Σπυρόπουλος', 'petros.spyropoulos@student.upatras.gr', '6901234570', 9),
('1005', 'Σοφία', 'Καραγιάννη', 'sofia.karagianni@student.upatras.gr', '6901234571', 7);

-- Add sample thesis topics
INSERT INTO thesis_topic (title, description, instructor_id, state, pdf) VALUES
('Ανάπτυξη Εφαρμογής Machine Learning για Πρόβλεψη Καιρού', 
 'Δημιουργία εφαρμογής που χρησιμοποιεί αλγορίθμους μηχανικής μάθησης για την πρόβλεψη καιρικών συνθηκών με βάση ιστορικά δεδομένα.', 
 1, 'Χωρίς Ανάθεση', NULL),

('Σύστημα Διαχείρισης Βιβλιοθήκης με Web Interface', 
 'Ανάπτυξη πλήρους συστήματος διαχείρισης βιβλιοθήκης με δυνατότητες καταλογογράφησης, δανεισμού και επιστροφής βιβλίων.', 
 1, 'Χωρίς Ανάθεση', NULL),

('Εφαρμογή IoT για Smart Home Automation', 
 'Σχεδιασμός και υλοποίηση συστήματος αυτοματισμού σπιτιού χρησιμοποιώντας αισθητήρες IoT και πλατφόρμες cloud computing.', 
 2, 'Χωρίς Ανάθεση', NULL),

('Ανάλυση Δεδομένων Social Media με Big Data Τεχνικές', 
 'Μελέτη και ανάλυση δεδομένων από κοινωνικά δίκτυα για την εξαγωγή χρήσιμων συμπερασμάτων και τάσεων.', 
 2, 'Υπό Ανάθεση', NULL),

('Blockchain System για Supply Chain Management', 
 'Υλοποίηση συστήματος blockchain για την παρακολούθηση και διαχείριση εφοδιαστικής αλυσίδας προϊόντων.', 
 3, 'Χωρίς Ανάθεση', NULL);

-- Assign one topic to a student (for demonstration)
UPDATE thesis_topic 
SET student_id = '1001', state = 'Υπό Ανάθεση', time_of_activation = '2024-12-01'
WHERE title = 'Ανάλυση Δεδομένων Social Media με Big Data Τεχνικές';

-- Add some users for login (professors)
INSERT INTO users (email, password_hash, role) VALUES
('gpapadopoulos@upatras.gr', '$2b$10$xQz9UHx3Pz4U7/Qw8VvKK.RHK2yF5gHjIqZ4K/9Js2nX8sL4Hm6Ny', 'professor'),
('mkonstantinou@upatras.gr', '$2b$10$xQz9UHx3Pz4U7/Qw8VvKK.RHK2yF5gHjIqZ4K/9Js2nX8sL4Hm6Ny', 'professor'),
('dantoniou@upatras.gr', '$2b$10$xQz9UHx3Pz4U7/Qw8VvKK.RHK2yF5gHjIqZ4K/9Js2nX8sL4Hm6Ny', 'professor');

-- The password for all professors is "password123"

COMMIT;
