show tables;

select * from thesis_up.users;
select * from thesis_up.secretary;
describe thesis_up.student;
describe thesis_up.professor;
select * from thesis_up.student;
select * from thesis_up.professor;
describe thesis_topic;
select * from thesis_up.thesis_topic;
SELECT * FROM thesis_up.professor WHERE professor_id IN (1, 2);
        SELECT 
            tt.thesis_id,
            tt.title,
            tt.description,
            tt.state,
            tt.student_id,
            tt.member1,
            tt.member2,
            DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
            s.name as name,
            s.surname as surname,
            m1.name as mentor_name,
            m1.surname as mentor_surname,
            m2.name as mentortwo_name,
            m2.surname as mentortwo_surname,
            CONCAT(s.name, ' ', s.surname) as full_student_name,
            CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
            CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name
        FROM thesis_topic tt
        LEFT JOIN student s ON tt.student_id = s.student_number
        LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
        LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
        WHERE tt.state = 'Ενεργή' OR tt.state = 'Υπό Εξέταση'
        ORDER BY tt.thesis_id ASC;