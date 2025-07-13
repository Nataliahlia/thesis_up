show tables;

select * from thesis_up.users;
select * from thesis_up.secretary;
describe thesis_up.student;
describe thesis_up.professor;
select * from thesis_up.student;
select * from thesis_up.professor;
describe thesis_topic;
select * from thesis_up.thesis_topic;
    SELECT 
        tt.title, 
        tt.description, 
        tt.pdf, 
        tt.state,
        DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
        instructor.name as instructor_name,
        instructor.surname as instructor_surname,
        m1.name as mentor_name,
        m1.surname as mentor_surname,
        m2.name as mentortwo_name,
        m2.surname as mentortwo_surname,
        CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
        CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name,
        CONCAT(instructor.name, ' ', instructor.surname) as full_instructor_name
    FROM thesis_topic tt
    LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
    LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
    LEFT JOIN professor instructor ON tt.instructor_id = instructor.professor_id
    WHERE student_id = 10002;
    SELECT 
        tt.title, 
        tt.description, 
        tt.pdf, 
        tt.state,
        DATEDIFF(NOW(), tt.time_of_activation) as days_since_activation,
        instructor.name as instructor_name,
        instructor.surname as instructor_surname,
        m1.name as mentor_name,
        m1.surname as mentor_surname,
        m2.name as mentortwo_name,
        m2.surname as mentortwo_surname,
        CONCAT(m1.name, ' ', m1.surname) as full_mentor_name,
        CONCAT(m2.name, ' ', m2.surname) as full_mentortwo_name,
        CONCAT(instructor.name, ' ', instructor.surname) as full_instructor_name
    FROM thesis_topic tt
    LEFT JOIN professor m1 ON tt.member1 = m1.professor_id
    LEFT JOIN professor m2 ON tt.member2 = m2.professor_id
    LEFT JOIN professor instructor ON tt.instructor_id = instructor.professor_id
    WHERE student_id = 10003;