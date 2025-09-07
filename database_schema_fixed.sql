-- ================================================================
-- THESIS MANAGEMENT SYSTEM - DATABASE SCHEMA (FIXED VERSION)
-- ================================================================

DROP DATABASE IF EXISTS thesis_up;

CREATE DATABASE thesis_up
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE thesis_up;

-- ================================================================
-- CORE TABLES
-- ================================================================

CREATE TABLE student (
  student_number INT PRIMARY KEY,
  id INT NOT NULL,
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
  CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE secretary (
	secretary_id INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    landline_telephone VARCHAR(10),
    mobile_telephone VARCHAR(10),
    CHECK (CHAR_LENGTH(landline_telephone) = 10)
);

CREATE TABLE professor (
	professor_id INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
  topic VARCHAR(255),
  department VARCHAR(255),
  university VARCHAR(255),
  landline VARCHAR(10),
  mobile VARCHAR(10),
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
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id INT NOT NULL,
  student_id INT,
  member1 INT,
  member2 INT,
  state ENUM(
    'Χωρίς Ανάθεση',
    'Υπό Ανάθεση',
    'Ανατεθειμένη', 
    'Υπό Εξέταση',
    'Ενεργή',
    'Ολοκληρωμένη',
    'Ακυρωμένη'
  ) DEFAULT 'Χωρίς Ανάθεση',
  submission_date DATE,
  defense_date DATE,
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
    cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assembly_number VARCHAR(50),
    assembly_year YEAR
);

CREATE INDEX idx_canceled_thesis_date ON canceled_thesis(cancelled_at);

CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type ENUM('Διά Ζώσης', 'Διαδικτυακά') NOT NULL,
    location_or_link VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    state ENUM('waiting', 'uploaded') DEFAULT 'waiting',
    
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id)
);

CREATE TABLE thesis_committee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    role ENUM('supervisor', 'member'),
    
    UNIQUE KEY unique_thesis_professor (thesis_id, professor_id),
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

CREATE TABLE thesis_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    event_type VARCHAR(100),
    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status ENUM(
        'Χωρίς Ανάθεση',
        'Ακυρωμένη'
    ) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id)
);

CREATE TABLE thesis_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    grade DECIMAL(4,2),
    comment_type ENUM(
        'general',
        'correction',
        'final'
    ) DEFAULT 'general',
    comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

-- ================================================================
-- TRIGGERS
-- ================================================================

DELIMITER //

CREATE TRIGGER after_insert_student
AFTER INSERT ON student
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (NEW.id, NEW.name, NEW.surname, NEW.email, NEW.password_hash, 'student');
END;
//

CREATE TRIGGER after_insert_secretary
AFTER INSERT ON secretary
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (NEW.id, NEW.name, NEW.surname, NEW.email, NEW.password_hash, 'secretary');
END;
//

CREATE TRIGGER after_insert_professor
AFTER INSERT ON professor
FOR EACH ROW
BEGIN
  INSERT INTO users (id, name, surname, email, password_hash, role)
  VALUES (NEW.id, NEW.name, NEW.surname, NEW.email, NEW.password_hash, 'professor');
END;
//

CREATE TRIGGER check_committee_limit
BEFORE UPDATE ON thesis_committee
FOR EACH ROW
BEGIN
    DECLARE member_count INT;
    SELECT COUNT(*) INTO member_count 
    FROM thesis_committee 
    WHERE thesis_id = NEW.thesis_id;
    
    IF member_count >= 3 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot have more than 3 committee members';
    END IF;
END;
//

CREATE TRIGGER calculate_thesis_final_grade
AFTER INSERT ON thesis_comments
FOR EACH ROW
BEGIN
    DECLARE total_grades INT DEFAULT 0;
    DECLARE avg_grade DECIMAL(4,2);
    
    SELECT COUNT(*), AVG(grade) INTO total_grades, avg_grade
    FROM thesis_comments 
    WHERE thesis_id = NEW.thesis_id AND grade IS NOT NULL;
    
    IF total_grades >= 3 THEN
        UPDATE thesis_topic 
        SET final_grade = avg_grade 
        WHERE thesis_id = NEW.thesis_id;
    END IF;
END;
//

CREATE TRIGGER update_thesis_final_grade
AFTER UPDATE ON thesis_comments
FOR EACH ROW
BEGIN
    DECLARE total_grades INT DEFAULT 0;
    DECLARE avg_grade DECIMAL(4,2);
    
    SELECT COUNT(*), AVG(grade) INTO total_grades, avg_grade
    FROM thesis_comments 
    WHERE thesis_id = NEW.thesis_id AND grade IS NOT NULL;
    
    IF total_grades >= 3 THEN
        UPDATE thesis_topic 
        SET final_grade = avg_grade 
        WHERE thesis_id = NEW.thesis_id;
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
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Committee members must be distinct';
  END IF;
END;
//

DELIMITER ;

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

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
-- ================================================================

INSERT INTO secretary (id, email, password_hash, name, surname, landline_telephone, mobile_telephone) VALUES
(1000001, 'sec1000001@ac.upatras.gr', 'pending', 'Μαρία', 'Παπαδοπούλου', '2610123456', '6912345678'),
(1000002, 'sec1000002@ac.upatras.gr', 'pending', 'Νίκος', 'Δημητρίου', '2610765432', '6945678910');

-- ================================================================
-- COMPLETED SUCCESSFULLY
-- ================================================================
