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
    street VARCHAR(50) NOT NULL,
    number VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    postcode INT NOT NULL,
    father_name VARCHAR(50) NOT NULL,
    landline_telephone CHAR(10) NOT NULL, 
    mobile_telephone CHAR(10) NOT NULL,
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

CREATE TABLE thesis_topic (
	thesis_id INT auto_increment PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NOT NULL,
    instructor_id INT NOT NULL,
    pdf VARCHAR(255),
    state ENUM("Χωρίς Ανάθεση", "Υπό Ανάθεση", "Ενεργή", "Περατωμένη", "Υπό Εξέταση", "Ακυρωμένη") NOT NULL,
    student_id INT,
    member1 INT,
    member2 INT,
    time_of_activation DATETIME,
    date_of_examination DATE,
    time_of_examination TIME,
    way_of_examination ENUM('Διά Ζώσης', 'Διαδικτυακά'),
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
    FOREIGN KEY (id) REFERENCES thesis_topic(thesis_id)
);

ALTER TABLE canceled_thesis 
ADD COLUMN cancelled_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ημερομηνία ακύρωσης',
ADD COLUMN assembly_number VARCHAR(50) NULL COMMENT 'Αριθμός Γενικής Συνέλευσης για ακύρωση',
ADD COLUMN assembly_year YEAR NULL COMMENT 'Έτος Γενικής Συνέλευσης για ακύρωση',
ADD INDEX idx_canceled_thesis_date (cancelled_at);

CREATE TABLE member_request (
	request_id INT auto_increment PRIMARY KEY,
	student_id INT NOT NULL,
	professor_id INT NOT NULL,
    date_of_request DATE NOT NULL,
    date_of_acceptance DATE,
    date_of_denial DATE,
    FOREIGN KEY (student_id) REFERENCES student(student_number),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id)
);

-- Create table for announcements (needed for public endpoint)
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type ENUM('Διά Ζώσης', 'Διαδικτυακά') NOT NULL,
    location_or_link VARCHAR(255),
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id)
);

-- Create table for thesis committee members
CREATE TABLE thesis_committee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    role ENUM('supervisor', 'member', 'secretary') NOT NULL,
    invitation_date DATE,
    acceptance_date DATE,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (professor_id) REFERENCES professor(professor_id),
    UNIQUE KEY unique_thesis_professor (thesis_id, professor_id)
);

-- Create table for thesis timeline/events
CREATE TABLE thesis_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    status VARCHAR(50),
    created_by INT,
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (created_by) REFERENCES professor(professor_id)
);

-- Create table for thesis files
CREATE TABLE thesis_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10),
    file_size INT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT,
    description TEXT,
    FOREIGN KEY (thesis_id) REFERENCES thesis_topic(thesis_id),
    FOREIGN KEY (uploaded_by) REFERENCES professor(professor_id)
);

-- Create table for thesis comments/grades from committee
CREATE TABLE thesis_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    professor_id INT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    grade DECIMAL(4,2),
    comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    comment_type ENUM('progress', 'final', 'correction', 'general', 'meeting', 'deadline', 'issue', 'achievement') DEFAULT 'progress',
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

-- Insert initial secretary data
INSERT INTO secretary (email, password_hash, name, surname, landline_telephone, mobile_telephone) VALUES
('sec1000001@ac.upatras.gr', 'pending', 'Μαρία', 'Παπαδοπούλου', '2610123456', '6912345678'),
('sec1000002@ac.upatras.gr', 'pending', 'Νίκος', 'Δημητρίου', '2610765432', '6945678910');
