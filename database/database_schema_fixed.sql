-- ================================================================
-- THESIS MANAGEMENT SYSTEM - DATABASE SCHEMA (FIXED VERSION)

DROP DATABASE IF EXISTS thesis_up;

CREATE DATABASE thesis_up
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE thesis_up;

-- ================================================================
-- CORE TABLES

CREATE TABLE student (
  student_number INT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  surname VARCHAR(50) NOT NULL,
  -- Address fields used by the secretary upload
  street VARCHAR(255),
  number INT,
  city VARCHAR(100),
  postcode VARCHAR(10),
  father_name VARCHAR(50),
  landline_telephone VARCHAR(10),
  mobile_telephone VARCHAR(10),
  CHECK (email LIKE 'up%@ac.upatras.gr'),
  CHECK (CHAR_LENGTH(mobile_telephone) = 10),
  CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE secretary (
	secretary_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    landline_telephone VARCHAR(10),
    mobile_telephone VARCHAR(10),
    CHECK (email LIKE 'sec%@ac.upatras.gr'),
    CHECK (CHAR_LENGTH(mobile_telephone) = 10),
    CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE professor (
	professor_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
  topic VARCHAR(255),
  department VARCHAR(255),
  university VARCHAR(255),
  landline VARCHAR(10),
  mobile VARCHAR(10),
  CHECK (email LIKE 'prof%@ac.upatras.gr'),
  CHECK (CHAR_LENGTH(mobile) = 10),
  CHECK (CHAR_LENGTH(landline) = 10)
);

CREATE TABLE users (
	user_id INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'secretary', 'professor') NOT NULL
);

CREATE TABLE thesis_topic (
  thesis_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  instructor_id INT NOT NULL,
  student_id INT,
  member1 INT,
  member2 INT,
  state ENUM("Χωρίς Ανάθεση", "Υπό Ανάθεση", "Ενεργή", "Υπό Εξέταση", "Περατωμένη", "Ακυρωμένη") NOT NULL,
  time_of_activation DATETIME,
  additional_links TEXT,
  protocol_number INT,
  practical_file VARCHAR(255),
  nimertis_link VARCHAR(255),
  final_grade DECIMAL(4,2),
  pdf VARCHAR(255),
  draft_file VARCHAR(255),
  -- Foreign Keys
  FOREIGN KEY (instructor_id) REFERENCES professor(professor_id),
  FOREIGN KEY (student_id) REFERENCES student(student_number),
  FOREIGN KEY (member1) REFERENCES professor(professor_id),
  FOREIGN KEY (member2) REFERENCES professor(professor_id)
);

CREATE TABLE canceled_thesis (
	submission_id INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    state ENUM('ακυρωμένη') DEFAULT 'ακυρωμένη',
    reason ENUM('από Διδάσκοντα', 'κατόπιν αίτησης Φοιτητή/τριας') NOT NULL,
    cancelled_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ημερομηνία ακύρωσης',
    assembly_number VARCHAR(50) NULL COMMENT 'Αριθμός Γενικής Συνέλευσης για ακύρωση',
    assembly_year YEAR NULL COMMENT 'Έτος Γενικής Συνέλευσης για ακύρωση'
);

CREATE INDEX idx_canceled_thesis_date ON canceled_thesis(cancelled_at);

CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type ENUM('Διά Ζώσης', 'Διαδικτυακά') NOT NULL,
    location_or_link VARCHAR(255),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    state ENUM('waiting', 'uploaded') DEFAULT 'waiting',
    
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id)
);

CREATE TABLE thesis_committee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    role ENUM('supervisor', 'member') NULL,
    invitation_date DATE,
    acceptance_date DATE,
    denial_date DATE,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    
    UNIQUE KEY unique_thesis_professor (thesis_id, professor_id),
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

CREATE TABLE thesis_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    event_type VARCHAR(100) NULL,
    event_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status ENUM(
      'Χωρίς Ανάθεση',
      'Υπό Ανάθεση',
      'Ενεργή',
      'Υπό Εξέταση',
      'Περατωμένη',
      'Ακυρωμένη'
    ) NOT NULL,
    created_by VARCHAR(100) NOT NULL
    
);

CREATE TABLE thesis_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    grade DECIMAL(4,2),
    comment_type ENUM(
        'general',      -- Γενική
        'progress',     -- Πρόοδος
        'meeting',      -- Συνάντηση
        'deadline',     -- Προθεσμία
        'issue',        -- Πρόβλημα
        'achievement',  -- Επίτευγμα
        'final',        -- Τελική
        'correction'    -- Διόρθωση
    ) DEFAULT 'progress',
    comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

-- ================================================================
-- TRIGGERS

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
END;
//

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
END;
//

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
END;
//

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
END;
//

DELIMITER ;

-- ================================================================
-- STORED PROCEDURES

DELIMITER //

CREATE PROCEDURE ResetProfessorTable()
BEGIN
  DELETE FROM professor;
  ALTER TABLE professor AUTO_INCREMENT = 1;
END;
//

CREATE PROCEDURE ResetSecretaryTable()
BEGIN
  DELETE FROM secretary;
  ALTER TABLE secretary AUTO_INCREMENT = 1;
END;
//

CREATE PROCEDURE ResetUserTable()
BEGIN
  DELETE FROM users;
  ALTER TABLE users AUTO_INCREMENT = 1;
END;
//

DELIMITER ;

-- ================================================================
-- INITIAL DATA

INSERT INTO secretary (email, password_hash, name, surname, landline_telephone, mobile_telephone) VALUES
('sec1000001@ac.upatras.gr', 'pending', 'Μαρία', 'Παπαδοπούλου', '2610123456', '6912345678'),
('sec1000002@ac.upatras.gr', 'pending', 'Νίκος', 'Δημητρίου', '2610765432', '6945678910');


