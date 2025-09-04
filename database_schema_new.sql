DROP DATABASE IF EXISTS thesis_up;

CREATE DATABASE thesis_up
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE thesis_up;

CREATE TABLE student (
	student_number INT PRIMARY KEY,
	email VARCHAR(50) NOT NULL UNIQUE,
	CHECK (email LIKE 'up%@ac.upatras.gr'),
	password_hash VARCHAR(255) NOT NULL,
	name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    street VARCHAR(50),
    number VARCHAR(50),
    city VARCHAR(50),
    postcode INT,
    father_name VARCHAR(50) NOT NULL,
    landline_telephone CHAR(10), 
    mobile_telephone CHAR(10),
    CHECK (CHAR_LENGTH(mobile_telephone) = 10),
    CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE secretary (
	secretary_id INT auto_increment PRIMARY KEY,
	email VARCHAR(50) NOT NULL UNIQUE,
	CHECK (email LIKE 'sec%@ac.upatras.gr'),
	password_hash VARCHAR(255) NOT NULL,
	name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
	landline_telephone CHAR(10) NOT NULL,
    mobile_telephone CHAR(10) NOT NULL,    
    CHECK (CHAR_LENGTH(mobile_telephone) = 10),
    CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE professor (
	professor_id INT auto_increment PRIMARY KEY,
	email VARCHAR(50) NOT NULL UNIQUE,
	CHECK (email LIKE 'prof%@ac.upatras.gr'),
	password_hash VARCHAR(255) NOT NULL,
	name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
	landline VARCHAR(10) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
	CHECK (CHAR_LENGTH(mobile) = 10),
    CHECK (CHAR_LENGTH(landline) = 10)
);

CREATE TABLE users (
	user_id INT auto_increment PRIMARY KEY,
	id INT,
	name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'secretary', 'professor') NOT NULL
);

-- CREATE TABLE thesis_topic (
-- 	thesis_id INT auto_increment PRIMARY KEY,
--     title VARCHAR(150) NOT NULL,
--     description VARCHAR(255) NOT NULL,
--     instructor_id INT NOT NULL,
--     pdf VARCHAR(255),
--     state ENUM("Χωρίς Ανάθεση", "Υπό Ανάθεση", "Ενεργή", "Περατωμένη", "Υπό Εξέταση", "Ακυρωμένη") NOT NULL,
--     student_id INT,
--     member1 INT,
--     member2 INT,
--     time_of_activation DATETIME,
--     date_of_examination DATE,
--     time_of_examination TIME,
--     way_of_examination ENUM('Διά Ζώσης', 'Διαδικτυακά'),
--     FOREIGN KEY (instructor_id) REFERENCES professor(professor_id),
-- 	FOREIGN KEY (student_id) REFERENCES student(student_number),
-- 	FOREIGN KEY (member1) REFERENCES professor(professor_id),
-- 	FOREIGN KEY (member2) REFERENCES professor(professor_id)
-- );

CREATE TABLE thesis_topic (
  thesis_id INT AUTO_INCREMENT PRIMARY KEY,
  -- Βασικά στοιχεία διπλωματικής 
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  -- Συσχετίσεις καθηγητών
  instructor_id INT NOT NULL,        
  member1 INT,                           
  member2 INT,                             
  -- === Συσχέτιση φοιτητή
  student_id INT UNIQUE,                 
  -- Κατάσταση διπλωματικής
  state ENUM("Χωρίς Ανάθεση", "Υπό Ανάθεση", "Ενεργή", "Υπό Εξέταση", "Περατωμένη", "Ακυρωμένη") NOT NULL,
  -- Αρχεία και σύνδεσμοι 
  pdf VARCHAR(255),                      
  draft_file VARCHAR(255),               
  additional_links TEXT,             
  -- Πληροφορίες ενεργοποίησης
  time_of_activation DATETIME,            -- Πότε έγινε ενεργή η διπλωματική         
  -- Ξένες κλείδες
  FOREIGN KEY (instructor_id) REFERENCES professor(professor_id),
  FOREIGN KEY (student_id) REFERENCES student(student_number),
  FOREIGN KEY (member1) REFERENCES professor(professor_id),
  FOREIGN KEY (member2) REFERENCES professor(professor_id)
);

ALTER TABLE thesis_topic
ADD COLUMN protocol_number INT AFTER additional_links,
ADD COLUMN practical_file VARCHAR(255) AFTER protocol_number;
ALTER TABLE thesis_topic
ADD COLUMN nimertis_link VARCHAR(255) NULL;
ALTER TABLE thesis_topic
ADD COLUMN final_grade INT NULL;
ALTER TABLE thesis_topic
MODIFY COLUMN final_grade DECIMAL(4,2) NULL;

CREATE TABLE canceled_thesis (
	submission_id INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    state ENUM('ακυρωμένη') DEFAULT 'ακυρωμένη',
    reason ENUM('από Διδάσκοντα', 'κατόπιν αίτησης Φοιτητή/τριας') NOT NULL-- ,
--     FOREIGN KEY (id) REFERENCES thesis_topic(thesis_id)
);

ALTER TABLE canceled_thesis 
ADD COLUMN cancelled_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ημερομηνία ακύρωσης',
ADD COLUMN assembly_number VARCHAR(50) NULL COMMENT 'Αριθμός Γενικής Συνέλευσης για ακύρωση',
ADD COLUMN assembly_year YEAR NULL COMMENT 'Έτος Γενικής Συνέλευσης για ακύρωση',
ADD INDEX idx_canceled_thesis_date (cancelled_at);
ALTER TABLE canceled_thesis DROP FOREIGN KEY canceled_thesis_ibfk_1;

-- Create table for announcements (needed for public endpoint)
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    -- title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type ENUM('Διά Ζώσης', 'Διαδικτυακά') NOT NULL,
    location_or_link VARCHAR(255),
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id)
);

ALTER TABLE announcements 
ADD COLUMN state ENUM('waiting', 'uploaded');

-- Create table for thesis committee members
CREATE TABLE thesis_committee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    role ENUM('supervisor', 'member', 'secretary') NOT NULL,
    invitation_date DATE,
    acceptance_date DATE,
    denial_date DATE,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id),
    UNIQUE KEY unique_thesis_professor (thesis_id, professor_id)
);

ALTER TABLE thesis_committee
MODIFY COLUMN role ENUM('supervisor', 'member') NULL;

-- Create table for thesis timeline/events
CREATE TABLE thesis_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    status VARCHAR(50), -- enum
    created_by INT,
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (created_by) REFERENCES professor(professor_id) 
);

ALTER TABLE thesis_events
DROP FOREIGN KEY thesis_events_ibfk_2,
MODIFY status ENUM(
    'Χωρίς Ανάθεση',
    'Υπό Ανάθεση',
    'Ενεργή',
    'Υπό Εξέταση',
    'Περατωμένη',
    'Ακυρωμένη'
) NOT NULL,
MODIFY event_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY event_type VARCHAR(100) NULL,
DROP FOREIGN KEY thesis_events_ibfk_1,
MODIFY created_by VARCHAR(100) NOT NULL;

-- Create table for thesis files
-- CREATE TABLE thesis_files (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     thesis_id INT NOT NULL,
--     file_name VARCHAR(255) NOT NULL,
--     file_path VARCHAR(500) NOT NULL,
--     file_type VARCHAR(10),
--     file_size INT,
--     upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
--     uploaded_by INT,
--     description TEXT,
--     FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
--     FOREIGN KEY (uploaded_by) REFERENCES professor(professor_id)
-- );

-- Create table for thesis comments/grades from committee
CREATE TABLE thesis_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    comment TEXT,
    grade DECIMAL(4,2),
    comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    comment_type ENUM('progress', 'final', 'correction') DEFAULT 'progress',
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

DELIMITER //

CREATE TRIGGER after_insert_student
AFTER INSERT ON student
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (
    NEW.student_number,
    NEW.name,
    NEW.surname,
    NEW.email,
    NEW.password_hash,
    'student'
  );
END;
//

DELIMITER ;

DELIMITER //

CREATE TRIGGER after_insert_secretary
AFTER INSERT ON secretary
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (
    NEW.secretary_id,
    NEW.name,
    NEW.surname,
    NEW.email,
    NEW.password_hash,
    'secretary'
  );
END;
//

DELIMITER ;

DELIMITER $$
CREATE TRIGGER check_committee_limit
BEFORE UPDATE ON thesis_committee
FOR EACH ROW
BEGIN
    DECLARE member_count INT;
    
    IF NEW.status = 'accepted' AND NEW.role = 'member' AND OLD.status != 'accepted' THEN
        SELECT COUNT(*) INTO member_count
        FROM thesis_committee 
        WHERE thesis_id = NEW.thesis_id 
        AND status = 'accepted' 
        AND role = 'member'
        AND id != NEW.id;
        
        IF member_count >= 2 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Committee already has maximum members';
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER //

CREATE TRIGGER after_insert_professor
AFTER INSERT ON professor
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (
    NEW.professor_id,
    NEW.name,
    NEW.surname,
    NEW.email,
    NEW.password_hash,
    'professor'
  );
END;
//

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE ResetProfessorTable()
BEGIN
  DELETE FROM professor;
  ALTER TABLE professor AUTO_INCREMENT = 1;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE ResetSecretaryTable()
BEGIN
  DELETE FROM secretary;
  ALTER TABLE secretary AUTO_INCREMENT = 1;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE ResetUserTable()
BEGIN
  DELETE FROM users;
  ALTER TABLE users AUTO_INCREMENT = 1;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER distinct_members
BEFORE INSERT ON thesis_topic
FOR EACH ROW
BEGIN
  IF NEW.instructor_id = NEW.member1 OR
     NEW.instructor_id = NEW.member2 OR
     NEW.member1 = NEW.member2 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Οι τρεις καθηγητές πρέπει να είναι διαφορετικοί.';
  END IF;
END$$

DELIMITER ;

-- Δημιουργία trigger που θα τρέχει μετά από κάθε INSERT ή UPDATE στον thesis_comments
DELIMITER $$

CREATE TRIGGER calculate_thesis_final_grade
AFTER INSERT ON thesis_comments
FOR EACH ROW
BEGIN
    DECLARE total_grades INT DEFAULT 0;
    DECLARE avg_grade DECIMAL(4,2) DEFAULT 0;
    DECLARE thesis_instructor_id INT;
    DECLARE thesis_member1_id INT;
    DECLARE thesis_member2_id INT;
    
    -- Μόνο αν η εισαγωγή είναι για τελικό βαθμό
    IF NEW.comment_type = 'final' THEN
        
        -- Παίρνουμε τα στοιχεία της διπλωματικής (επιβλέπων και μέλη επιτροπής)
        SELECT instructor_id, member1, member2 
        INTO thesis_instructor_id, thesis_member1_id, thesis_member2_id
        FROM thesis_topic 
        WHERE thesis_id = NEW.thesis_id;
        
        -- Μετράμε πόσοι βαθμοί υπάρχουν για αυτή τη διπλωματική με comment_type = 'final'
        -- από τους 3 καθηγητές της επιτροπής (επιβλέπων + 2 μέλη)
        SELECT COUNT(*) 
        INTO total_grades
        FROM thesis_comments tc
        WHERE tc.thesis_id = NEW.thesis_id 
          AND tc.comment_type = 'final'
          AND tc.professor_id IN (thesis_instructor_id, thesis_member1_id, thesis_member2_id);
        
        -- Αν έχουμε και τους 3 βαθμούς, υπολογίζουμε τον μέσο όρο
        IF total_grades = 3 THEN
            SELECT AVG(tc.grade)
            INTO avg_grade
            FROM thesis_comments tc
            WHERE tc.thesis_id = NEW.thesis_id 
              AND tc.comment_type = 'final'
              AND tc.professor_id IN (thesis_instructor_id, thesis_member1_id, thesis_member2_id);
            
            -- Αποθηκεύουμε τον μέσο όρο στον πίνακα thesis_topic
            UPDATE thesis_topic 
            SET final_grade = ROUND(avg_grade, 2)
            WHERE thesis_id = NEW.thesis_id;
        END IF;
    END IF;
END$$

DELIMITER ;

-- Trigger για UPDATE στον thesis_comments (σε περίπτωση που κάποιος αλλάξει βαθμό)
DELIMITER $$

CREATE TRIGGER update_thesis_final_grade
AFTER UPDATE ON thesis_comments
FOR EACH ROW
BEGIN
    DECLARE total_grades INT DEFAULT 0;
    DECLARE avg_grade DECIMAL(4,2) DEFAULT 0;
    DECLARE thesis_instructor_id INT;
    DECLARE thesis_member1_id INT;
    DECLARE thesis_member2_id INT;
    
    -- Μόνο αν η ενημέρωση είναι για τελικό βαθμό
    IF NEW.comment_type = 'final' THEN
        
        -- Παίρνουμε τα στοιχεία της διπλωματικής
        SELECT instructor_id, member1, member2 
        INTO thesis_instructor_id, thesis_member1_id, thesis_member2_id
        FROM thesis_topic 
        WHERE thesis_id = NEW.thesis_id;
        
        -- Μετράμε πόσοι βαθμοί υπάρχουν
        SELECT COUNT(*) 
        INTO total_grades
        FROM thesis_comments tc
        WHERE tc.thesis_id = NEW.thesis_id 
          AND tc.comment_type = 'final'
          AND tc.professor_id IN (thesis_instructor_id, thesis_member1_id, thesis_member2_id);
        
        -- Αν έχουμε και τους 3 βαθμούς, υπολογίζουμε ξανά τον μέσο όρο
        IF total_grades = 3 THEN
            SELECT AVG(tc.grade)
            INTO avg_grade
            FROM thesis_comments tc
            WHERE tc.thesis_id = NEW.thesis_id 
              AND tc.comment_type = 'final'
              AND tc.professor_id IN (thesis_instructor_id, thesis_member1_id, thesis_member2_id);
            
            -- Ενημερώνουμε τον τελικό βαθμό
            UPDATE thesis_topic 
            SET final_grade = ROUND(avg_grade, 2)
            WHERE thesis_id = NEW.thesis_id;
        END IF;
        
    END IF;
END$$

DELIMITER ;

-- Επιβεβαίωση δημιουργίας
SELECT 'Triggers για αυτόματο υπολογισμό τελικού βαθμού δημιουργήθηκαν επιτυχώς!' as message;

-- Insert initial secretary data
INSERT INTO secretary (email, password_hash, name, surname, landline_telephone, mobile_telephone) VALUES
('sec1000001@ac.upatras.gr', 'pending', 'Μαρία', 'Παπαδοπούλου', '2610123456', '6912345678'),
('sec1000002@ac.upatras.gr', 'pending', 'Νίκος', 'Δημητρίου', '2610765432', '6945678910');

CALL ResetProfessorTable();
CALL ResetSecretaryTable();
CALL ResetUserTable();