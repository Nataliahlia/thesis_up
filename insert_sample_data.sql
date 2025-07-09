USE thesis_up;

-- Insert students
INSERT INTO student (student_number, email, name, surname, street, number, city, postcode, father_name, landline_telephone, mobile_telephone, password_hash) VALUES
(10002, 'up10002@ac.upatras.gr', 'Κωνσταντίνα', 'Πετροπούλου', 'Αγίου Νικολάου', '18', 'Πάτρα', 26772, 'Νικόλαος', '2610234999', '6978123409', '$2b$10$temp.password.hash.for.student.10002'),
(10003, 'up10003@ac.upatras.gr', 'Γιώργος', 'Παπαδόπουλος', 'Κωνσταντινουπόλεως', '20', 'Πάτρα', 26443, 'Νικόλαος', '2610454699', '6956455690', '$2b$10$temp.password.hash.for.student.10003');

-- Insert professors
INSERT INTO professor (email, name, surname, topic, department, university, landline, mobile, password_hash) VALUES
('prof1@ac.upatras.gr', 'Χρήστος', 'Λαζαρόπουλος', 'Ασφάλεια Δικτύων', 'Τομέας Λογισμικού', 'Πανεπιστήμιο Πατρών', '2610234980', '6956239571', '$2b$10$temp.password.hash.for.prof1'),
('prof2@ac.upatras.gr', 'Νικόλαος', 'Κωνσταντινίδης', 'Τεχνητή Νοημοσύνη', 'Τομέας Λογισμικού', 'Πανεπιστήμιο Πατρών', '2610789034', '6948034576', '$2b$10$temp.password.hash.for.prof2');
