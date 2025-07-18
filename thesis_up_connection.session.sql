show tables;

select * from thesis_up.users;
select * from thesis_up.secretary;
describe thesis_up.student;
describe thesis_up.professor;
select * from thesis_up.student;
select * from thesis_up.professor;
describe thesis_topic;
DESCRIBE student;
select * from thesis_up.thesis_topic;
select * from thesis_up.thesis_topic;
    SELECT 
      a.id, 
      a.thesis_id, 
      a.date, 
      a.time, 
      a.type, 
      a.location_or_link,
      t.title AS thesis_title,
      p.name AS instructor_name,
      p.surname AS instructor_surname,
      s.name AS student_name,
      s.surname AS student_surname,
      CONCAT(p.name, ' ', p.surname) AS instructor_full_name,
      CONCAT(s.name, ' ', s.surname) AS student_full_name
    FROM announcements a
    JOIN thesis_topic t ON a.thesis_id = t.thesis_id
    JOIN professor p ON t.instructor_id = p.professor_id
    JOIN student s ON t.student_id = s.student_number
    WHERE t.state = 'Υπό Εξέταση'