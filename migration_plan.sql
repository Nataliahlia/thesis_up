-- Migration Plan: Ενοποίηση στο thesis_committee σύστημα
-- Αυτό το αρχείο δείχνει πώς να μεταφέρουμε δεδομένα από το παλιό στο νέο σύστημα

-- ΒΗΜΑ 1: Μεταφορά υπαρχόντων supervisor ρόλων
INSERT INTO thesis_committee (thesis_id, professor_id, role, invitation_date, acceptance_date, status)
SELECT 
    thesis_id,
    instructor_id,
    'supervisor',
    time_of_activation,
    time_of_activation,
    'accepted'
FROM thesis_topic 
WHERE instructor_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM thesis_committee tc 
    WHERE tc.thesis_id = thesis_topic.thesis_id 
    AND tc.professor_id = thesis_topic.instructor_id
);

-- ΒΗΜΑ 2: Μεταφορά member1 ρόλων
INSERT INTO thesis_committee (thesis_id, professor_id, role, invitation_date, acceptance_date, status)
SELECT 
    tt.thesis_id,
    tt.member1,
    'member',
    mr.date_of_request,
    mr.date_of_acceptance,
    CASE 
        WHEN mr.date_of_acceptance IS NOT NULL THEN 'accepted'
        WHEN mr.date_of_denial IS NOT NULL THEN 'declined'
        ELSE 'pending'
    END
FROM thesis_topic tt
LEFT JOIN member_request mr ON tt.student_id = mr.student_id AND tt.member1 = mr.professor_id
WHERE tt.member1 IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM thesis_committee tc 
    WHERE tc.thesis_id = tt.thesis_id 
    AND tc.professor_id = tt.member1
);

-- ΒΗΜΑ 3: Μεταφορά member2 ρόλων
INSERT INTO thesis_committee (thesis_id, professor_id, role, invitation_date, acceptance_date, status)
SELECT 
    tt.thesis_id,
    tt.member2,
    'member',
    mr.date_of_request,
    mr.date_of_acceptance,
    CASE 
        WHEN mr.date_of_acceptance IS NOT NULL THEN 'accepted'
        WHEN mr.date_of_denial IS NOT NULL THEN 'declined'
        ELSE 'pending'
    END
FROM thesis_topic tt
LEFT JOIN member_request mr ON tt.student_id = mr.student_id AND tt.member2 = mr.professor_id
WHERE tt.member2 IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM thesis_committee tc 
    WHERE tc.thesis_id = tt.thesis_id 
    AND tc.professor_id = tt.member2
);

-- ΒΗΜΑ 4: Μεταφορά εκκρεμών προσκλήσεων από member_request
INSERT INTO thesis_committee (thesis_id, professor_id, role, invitation_date, status)
SELECT 
    tt.thesis_id,
    mr.professor_id,
    'member',
    mr.date_of_request,
    CASE 
        WHEN mr.date_of_acceptance IS NOT NULL THEN 'accepted'
        WHEN mr.date_of_denial IS NOT NULL THEN 'declined'
        ELSE 'pending'
    END
FROM member_request mr
JOIN thesis_topic tt ON mr.student_id = tt.student_id
WHERE mr.date_of_acceptance IS NULL AND mr.date_of_denial IS NULL
AND NOT EXISTS (
    SELECT 1 FROM thesis_committee tc 
    WHERE tc.thesis_id = tt.thesis_id 
    AND tc.professor_id = mr.professor_id
);

-- ΒΗΜΑ 5: Αφαίρεση παλιών στηλών (ΜΕΤΑ από επιβεβαίωση)
-- ALTER TABLE thesis_topic DROP COLUMN member1;
-- ALTER TABLE thesis_topic DROP COLUMN member2;

-- ΒΗΜΑ 6: Αφαίρεση παλιού πίνακα (ΜΕΤΑ από επιβεβαίωση)
-- DROP TABLE member_request;
