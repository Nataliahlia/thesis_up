-- Trigger για αυτόματο υπολογισμό μέσου όρου βαθμολογίας διπλωματικής

USE thesis_up;

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
            
            -- Προαιρετικά: αλλάζουμε την κατάσταση της διπλωματικής σε "Περατωμένη"
            UPDATE thesis_topic 
            SET state = 'Περατωμένη'
            WHERE thesis_id = NEW.thesis_id AND state = 'Υπό Εξέταση';
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
