USE thesis_up;

-- Update student passwords with proper bcrypt hashes
-- Password for student 10002: stud10002@2025
UPDATE student SET password_hash = '$2b$10$YourBcryptHashForStudent10002' WHERE student_number = 10002;
UPDATE users SET password_hash = '$2b$10$YourBcryptHashForStudent10002' WHERE id = 10002 AND role = 'student';

-- Password for student 10003: stud10003@2025  
UPDATE student SET password_hash = '$2b$10$YourBcryptHashForStudent10003' WHERE student_number = 10003;
UPDATE users SET password_hash = '$2b$10$YourBcryptHashForStudent10003' WHERE id = 10003 AND role = 'student';

-- Password for professor 1: prof_prof1@2025
UPDATE professor SET password_hash = '$2b$10$YourBcryptHashForProf1' WHERE professor_id = 1;
UPDATE users SET password_hash = '$2b$10$YourBcryptHashForProf1' WHERE id = 1 AND role = 'professor';

-- Password for professor 2: prof_prof2@2025
UPDATE professor SET password_hash = '$2b$10$YourBcryptHashForProf2' WHERE professor_id = 2;
UPDATE users SET password_hash = '$2b$10$YourBcryptHashForProf2' WHERE id = 2 AND role = 'professor';
