Expanded Use Cases for Thesis Support System

Here's a breakdown of the system's functionalities into detailed use cases, categorized by user type.

I. Core System Use Cases (Authentication & General)
✅ UC1: User Login
•	Description: Allows an authenticated user (Instructor, Student, or Secretariat) to log into the system. 
•	Actors: Instructor, Student, Secretariat 
•	Preconditions: User has valid credentials (username/password).
•	Postconditions: User is authenticated and redirected to their respective home screen. 
•	Flow:
1.	System displays login page. 
2.	User enters username and password. 
3.	System validates credentials. 
4.	If valid, system grants access and redirects. 
5.	If invalid, system displays error message.
// If user is secretary data are imported through db

UC2: User Logout
•	Description: Allows a logged-in user to log out of the system. 
•	Actors: Instructor, Student, Secretariat 
•	Preconditions: User is logged in.
•	Postconditions: User is logged out and redirected to the login page.
•	Flow:
1.	User initiates logout action. 
2.	System terminates session. 
3.	System redirects to login page. 

UC3: View Public Thesis Presentation Announcements 
•	Description: Allows unauthenticated users to view announcements for thesis presentations within a specified time range. 
•	Actors: Public User (unauthenticated) 
•	Preconditions: None.
•	Postconditions: Announcements are displayed or generated as a feed. 
•	Flow:
1.	Public user accesses the dedicated public endpoint. 
2.	User optionally provides a time range. 
3.	User optionally requests an XML or JSON feed. 
4.	System retrieves and displays/generates announcements for the specified range. 

II. Instructor Use Cases
UC4: Create Thesis Topic
•	Description: An Instructor records a new thesis topic. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in. 
•	Postconditions: A new thesis topic is recorded and visible in the Instructor's list of created topics. 
•	Flow:
1.	Instructor selects "View and Create Thesis Topics". 
2.	Instructor provides title, short description, and optionally attaches a PDF. 
3.	System validates input.
4.	System saves the new topic.
5.	System displays the updated list of topics. 

UC5: Edit Thesis Topic
•	Description: An Instructor can modify details of a thesis topic they have created. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has created topics. 
•	Postconditions: The thesis topic details are updated.
•	Flow:
1.	Instructor selects "View and Create Thesis Topics". 
2.	Instructor chooses a topic from their list to edit. 
3.	Instructor modifies title, description, or attached PDF. 
4.	System validates and saves changes.
5.	System displays confirmation.

UC6: Assign Thesis Topic to Student (Initial)
•	Description: An Instructor temporarily assigns an available topic to a student. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has available topics. Student exists in the system. 
•	Postconditions: Topic is temporarily assigned to the student. 
•	Flow:
1.	Instructor selects "Initial Assignment of a Topic to a Student". 
2.	Instructor selects an available topic.
3.	Instructor searches for a student by ID or name. 
4.	Instructor confirms assignment.
5.	System records temporary assignment. 

UC7: Cancel Initial Topic Assignment
•	Description: An Instructor can cancel a temporary topic assignment before finalization. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has a temporarily assigned topic. 
•	Postconditions: The temporary assignment is cancelled. 
•	Flow:
1.	Instructor views the list of theses or specific assignment. 
2.	Instructor selects the "under assignment" thesis. 
3.	Instructor initiates cancellation of assignment. 
4.	System cancels the assignment and deletes related invitations. 
5.	System confirms cancellation.

UC8: View List of Theses (Instructor)
•	Description: An Instructor views all theses they are or have been involved with, with filtering options. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in. 
•	Postconditions: A filtered list of theses is displayed. 
•	Flow:
1.	Instructor selects "View List of Theses". 
2.	System displays all relevant theses. 
3.	Instructor optionally applies filters (status, role). 
4.	System updates the displayed list based on filters.

UC9: View Thesis Details (Instructor)
•	Description: An Instructor views detailed information for a selected thesis. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has selected a thesis from a list. 
•	Postconditions: Detailed thesis information is displayed. 
•	Flow:
1.	Instructor selects a thesis from their list. 
2.	System displays basic information, chronology, final grade (if completed), and links. 

UC10: Export Thesis List (Instructor)
•	Description: An Instructor exports their list of displayed theses to CSV or JSON. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has a displayed list of theses. 
•	Postconditions: A file containing the thesis data in the selected format is downloaded. 
•	Flow:
1.	Instructor selects export option. 
2.	Instructor chooses CSV or JSON format. 
3.	System generates and initiates download of the file.

UC11: View and Respond to Committee Invitations
•	Description: An Instructor views invitations to join Three-Member Committees and can accept or reject them. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and has active invitations. 
•	Postconditions: Invitation status is updated. 
•	Flow:
1.	Instructor selects "View Invitations to Participate in Three-Member Committees". 
2.	System displays list of invitations. 
3.	Instructor selects an invitation.
4.	Instructor chooses to accept or reject. 
5.	System updates invitation status and potentially the thesis status if enough members accept. 

UC12: View Instructor Statistics
•	Description: An Instructor views graphical statistics related to their supervised and committee theses. 
•	Actors: Instructor 
•	Preconditions: Instructor is logged in. 
•	Postconditions: Graphs displaying average completion time, average grade, and total number of theses are shown. 
•	Flow:
1.	Instructor selects "View Statistics". 
2.	System retrieves and displays statistics as graphs. 
(System calculates the average time it has taken for the theses to be completed when a. he is supervisor and b. he is just a member
System calculates the average score it has taken for the theses to be completed when a. he is supervisor and b. he is just a member
System calculates the total number of theses to be completed when a. he is supervisor and b. he is just a member)

Extra added use case: View Other Members
•	Description: An Instructor views the other members choices
•	Actors: Instructor 
•	Preconditions: Instructor is logged in and the theses state is “Under Assignment”
•	Postconditions: Just a redirection
•	Flow:
1.	Instructor selects “View other members”
2.	System retrieves and displays the information for the other members  (date of request, date of acceptance/decline)

UC13: Record Thesis Notes (Instructor)
•	Description: An Instructor records private notes related to an active thesis. 
•	Actors: Instructor (Supervisor or Committee Member) 
•	Preconditions: Instructor is logged in and the thesis is "Active". 
•	Postconditions: Note is recorded and visible only to the creator. 
•	Flow:
1.	Instructor views an "Active" thesis. 
2.	Instructor enters a note (up to 300 characters). 
3.	System saves the note.

UC14: Cancel Active Thesis (by Supervisor)
•	Description: A supervising Instructor can cancel an active thesis after two years and with General Assembly approval. 
•	Actors: Instructor (Supervisor) 
•	Preconditions: Instructor is logged in, is the supervisor of an "Active" thesis, and two years have elapsed. General Assembly approval details are available. 
•	Postconditions: Thesis status changes to "Cancelled", reason recorded. 
•	Flow:
1.	Instructor views an "Active" thesis they supervise. 
2.	Instructor initiates cancellation. 
3.	Instructor records General Assembly number and year. 
4.	System changes thesis status to "Cancelled" and records reason. 

UC15: Change Thesis Status to "Under Examination"
•	Description: The supervising Instructor changes the thesis status to "Under Examination". 
•	Actors: Instructor (Supervisor) 
•	Preconditions: Instructor is logged in and is the supervisor of an "Active" thesis. 
•	Postconditions: Thesis status is "Under Examination". 
•	Flow:
1.	Instructor views an "Active" thesis they supervise. 
2.	Instructor initiates status change to "Under Examination". 
3.	System updates thesis status.

UC16: View Thesis Draft (Instructor)
•	Description: Instructors (supervisor or committee member) can view the student's uploaded thesis draft. 
•	Actors: Instructor (Supervisor or Committee Member) 
•	Preconditions: Instructor is logged in and the thesis is "Under Examination". Student has uploaded a draft. 
•	Postconditions: Thesis draft is displayed. 
•	Flow:
1.	Instructor views an "Under Examination" thesis. 
2.	Instructor selects to view the thesis draft. 
3.	System displays the draft file.

UC17: Generate Presentation Announcement Text
•	Description: The supervising Instructor generates the announcement text for the thesis presentation. 
•	Actors: Instructor (Supervisor) 
•	Preconditions: Instructor is logged in, is the supervisor of an "Under Examination" thesis, and the student has completed presentation details. 
•	Postconditions: Presentation announcement text is generated and displayed. 
•	Flow:
1.	Instructor views an "Under Examination" thesis they supervise. 
2.	Instructor selects "Generate Announcement Text". 
3.	System generates and displays the announcement using student-provided details. 

UC18: Record Thesis Grade (Instructor)
•	Description: An Instructor records their grade for a thesis based on specific criteria. 
•	Actors: Instructor (Supervisor or Committee Member) 
•	Preconditions: Instructor is logged in, the thesis is "Under Examination", and grading ability is activated by the supervisor. 
•	Postconditions: Instructor's grade is recorded and visible to other committee members. 
•	Flow:
1.	Instructor views an "Under Examination" thesis. 
2.	If supervisor, Instructor activates grading ability. 
3.	Instructor enters their grade according to criteria. 
4.	System records the grade.
5.	System displays recorded grades from other members. -> αυτο θεωρω εαν εχουν βαλει τους βαθμους

Extra added use case: Give Grade as a professor
•	Description: A member gives their grade for a thesis based on specific criteria. 
•	Actors: Instructor Committee Member 
•	Preconditions: Instructor is logged in, the thesis is "Under Examination", and grading ability is activated by the supervisor. 
•	Postconditions: Instructor's grade is recorded and visible to other committee members. 
•	Flow:
1.	Instructor views an "Under Examination" thesis. 
2.	If grading ability has been activated, instructor enters their grade according to criteria. 
3.	System records the grade.
4.	System displays recorded grades from other members. -> αυτο θεωρω εαν εχουν βαλει τους βαθμους

III. Student Use Cases
✅ UC19: View Current Thesis Information (Student)
•	Description: A Student views the details and current status of their assigned thesis. 
•	Actors: Student 
•	Preconditions: Student is logged in and has an assigned thesis. 
•	Postconditions: Thesis details, status, committee members, and elapsed time are displayed. 
•	Flow:
1.	Student accesses their home screen. 
2.	System displays current thesis topic, description, status, and committee details. 
3.	System displays time elapsed since official assignment. 

✅ UC20: Edit Student Profile
•	Description: A Student enters and manages their contact details. 
•	Actors: Student 
•	Preconditions: Student is logged in. 
•	Postconditions: Student's contact details are updated.
•	Flow:
1.	Student selects "Edit Profile". 
2.	Student enters/modifies postal address, email, mobile, and landline phone. 
3.	System validates and saves changes.
// The email is only modified, it is used for the username

UC21: Select Committee Members (Student)
•	Description: A Student selects Instructors to invite as members of their Three-Member Committee. 
•	Actors: Student 
•	Preconditions: Student is logged in and thesis is "Under Assignment". 
•	Postconditions: Invitations are sent to selected Instructors; thesis transitions to "Active" when two accept. 
•	Flow:
1.	Student views their "Under Assignment" thesis. 
2.	Student searches for and selects Instructors to invite as committee members. 
3.	System sends invitations.
4.	System monitors responses and automatically transitions thesis to "Active" when two accept and deletes the other requests

UC22: Upload Thesis Draft and Supporting Material
•	Description: A Student uploads the draft text of their thesis and links to supporting material. 
•	Actors: Student 
•	Preconditions: Student is logged in and thesis is "Under Examination". 
•	Postconditions: Thesis draft file and links are uploaded and accessible to committee members. 
•	Flow:
1.	Student views their "Under Examination" thesis. 
2.	Student uploads the thesis draft file. 
3.	Student provides links to other material. 
4.	System stores the files/links.

UC23: Record Presentation Details
•	Description: A Student records the date, time, and location/link for their thesis examination. 
•	Actors: Student 
•	Preconditions: Student is logged in and thesis is "Under Examination". 
•	Postconditions: Presentation details are recorded, enabling the supervisor to generate the announcement. 
•	Flow:
1.	Student views their "Under Examination" thesis. 
2.	Student enters date and time of examination. 
3.	Student specifies examination method (in-person/online) and provides room or link. 
4.	System saves presentation details.

UC24: View Examination Report
•	Description: A Student views their examination report in HTML format. 
•	Actors: Student 
•	Preconditions: Student is logged in and grades have been recorded by committee members. 
•	Postconditions: Examination report is displayed. 
•	Flow:
1.	Student views their thesis. 
2.	Student selects to view the examination report. 
3.	System generates and displays the report in HTML.
(νομιζω ενωνεται με 25)
UC25: Record Library Repository Link
•	Description: A Student records the link to their final thesis text in the library repository (Nemertis). 
•	Actors: Student 
•	Preconditions: Student is logged in and thesis is "Under Examination", and grades have been recorded. 
•	Postconditions: Library repository link is recorded. 
•	Flow:
1.	Student views their "Under Examination" thesis. 
2.	Student enters the Nemertis link. 
3.	System saves the link.

UC26: View Completed Thesis Information (Student)
•	Description: A Student can view information for their completed thesis, including status changes and examination report. 
•	Actors: Student 
•	Preconditions: Student is logged in and thesis is "Completed". 
•	Postconditions: Thesis information and report are displayed. 
•	Flow:
1.	Student views their "Completed" thesis. 
2.	System displays thesis information, status changes, and examination report. 

IV. Secretariat Use Cases
✅ UC27: View Active and Under Examination Theses (Secretariat)
•	Description: Secretariat views a list of all "Active" and "Under Examination" theses. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in. 
•	Postconditions: A list of relevant theses is displayed. 
•	Flow:
1.	Secretariat selects "View Theses". 
2.	System displays all "Active" and "Under Examination" theses. 

✅ UC28: View Thesis Details (Secretariat)
•	Description: Secretariat views detailed information for a selected thesis. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in and has selected a thesis from the list. 
•	Postconditions: Detailed thesis information, including topic, description, status, committee, and elapsed time, is displayed. 
•	Flow:
1.	Secretariat selects a thesis from the displayed list. 
2.	System displays topic, description, status, committee, and elapsed time. 

✅ UC29: Import User Data
•	Description: Secretariat imports personal information of students and instructors from a JSON file. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in. A valid JSON file with user data is available. 
•	Postconditions: Student and Instructor data is imported into the system, with generated passwords. 
•	Flow:
1.	Secretariat selects "Data Import". 
2.	Secretariat uploads the JSON file. 
3.	System parses the file. 
4.	System imports data, creating usernames (e.g., from emails) and generating random passwords. 
5.	System confirms import status.

UC30: Record General Assembly AP Number
•	Description: Secretariat records the AP number from the General Assembly approval for an active thesis. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in and the thesis is "Active". 
•	Postconditions: AP number is recorded for the thesis. 
•	Flow:
1.	Secretariat views an "Active" thesis. 
2.	Secretariat records the AP number. 
3.	System saves the AP number.

UC31: Cancel Thesis Assignment (Secretariat)
•	Description: Secretariat cancels a thesis topic assignment, recording the General Assembly details and reason. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in and thesis is "Active". 
•	Postconditions: Thesis assignment is cancelled, and cancellation details are recorded. 
•	Flow:
1.	Secretariat views an "Active" thesis. 
2.	Secretariat initiates cancellation of assignment. 
3.	Secretariat records General Assembly number, year, and free-text reason. 
4.	System cancels assignment and records details.

UC32: Change Thesis Status to "Completed" (Secretariat)
•	Description: Secretariat changes the status of an "Under Examination" thesis to "Completed" after grades are recorded and the Nemertis link is provided. 
•	Actors: Secretariat 
•	Preconditions: Secretariat is logged in, thesis is "Under Examination", grades are recorded, and the Nemertis link is provided. 
•	Postconditions: Thesis status is "Completed". 
•	Flow:
1.	Secretariat views an "Under Examination" thesis. 
2.	Secretariat verifies grades are recorded and Nemertis link is present. 
3.	Secretariat initiates status change to "Completed". 
4.	System updates thesis status.

