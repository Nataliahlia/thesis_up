SELECT 
    tc.thesis_id,
    tc.professor_id,
    tc.grade,
    p.name AS professor_name,
    p.surname AS professor_surname,
    CASE 
        WHEN tt.instructor_id = tc.professor_id THEN 'Instructor'
        ELSE 'Member'
    END AS member_role
FROM thesis_comments tc
JOIN professor p ON tc.professor_id = p.professor_id
JOIN thesis_topic tt ON tc.thesis_id = tt.thesis_id
WHERE tc.thesis_id = 11;
select * from thesis_comments;
select * from thesis_topic;
select * from professor;
describe canceled_thesis;