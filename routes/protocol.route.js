const express = require('express');
const router = express.Router();
const connection = require('../db');

async function createProtocolHtml(thesisId) {
    // Fetch thesis', student' and announcement' details from the database
    const [[thesis]] = await connection.promise().query(`
        SELECT t.title, s.name AS student_name, s.surname AS student_surname, s.student_number, 
        t.final_grade, t.nimertis_link, t.protocol_number, a.date, a.location_or_link, a.time
        FROM thesis_topic t
        JOIN student s ON t.student_id = s.student_number
        JOIN announcements a ON t.thesis_id = a.thesis_id
        WHERE t.thesis_id = ?
    `, [thesisId]);

    // Check if thesis exists
    if (!thesis) throw new Error('Δεν βρέθηκε διπλωματική.');

    // Fetch grades' and professors' details from the database
    const [grades] = await connection.promise().query(`
        SELECT tc.grade, CONCAT(p.name, ' ', p.surname) AS full_name, 
               CASE 
                   WHEN p.professor_id = t.instructor_id THEN 'Επιβλέπων' 
                   ELSE 'Μέλος' 
               END AS role
        FROM thesis_comments tc
        JOIN professor p ON p.professor_id = tc.professor_id
        JOIN thesis_topic t ON t.thesis_id = tc.thesis_id
        WHERE tc.thesis_id = ?
    `, [thesisId]);

    return `
    <!-- We add the styling and the body of the HTML -->
    <!DOCTYPE html>
    <html lang="el">
    <head>
        <meta charset="UTF-8">
        <title>Πρακτικό Εξέτασης</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                padding: 20px;
                line-height: 1.6;
            }
            .center { text-align: center; }
            .section { margin: 30px 0; }
            .center-list {
                display: flex;
                flex-direction: column;
                align-items: center;
                list-style-position: inside;
                padding: 0;
                margin: 0 auto;
            }
            .center-list li, .center-list p {
                text-align: center;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <p class="center"><strong>ΠΡΟΓΡΑΜΜΑ ΣΠΟΥΔΩΝ</strong></p>
        <p class="center"><strong>«ΤΜΗΜΑΤΟΣ ΜΗΧΑΝΙΚΩΝ, ΗΛΕΚΤΡΟΝΙΚΩΝ ΥΠΟΛΟΓΙΣΤΗΣ ΚΑΙ ΠΛΗΡΟΦΟΡΙΚΗΣ» </strong></p>
        <p class="center"><strong>ΠΡΑΚΤΙΚΟ ΣΥΝΕΔΡΙΑΣΗΣ ΤΗΣ ΤΡΙΜΕΛΟΥΣ ΕΠΙΤΡΟΠΗΣ<br>ΓΙΑ ΤΗΝ ΠΑΡΟΥΣΙΑΣΗ ΚΑΙ ΚΡΙΣΗ ΤΗΣ ΔΙΠΛΩΜΑΤΙΚΗΣ ΕΡΓΑΣΙΑΣ</strong></p>

        <div class="section center">
            <div>του/της φοιτητή/φοιτήτρια</div>
            <div style="margin-top: 8px;">${thesis.student_name} ${thesis.student_surname}</div>
        </div>
        <div class="section center">
            Η συνεδρίαση πραγματοποιήθηκε στην αίθουσα 
            <span class="label-line">${thesis.location_or_link}</span>, 
            στις <span class="label-line">${new Date(thesis.date).toISOString().split('T')[0]}</span> 
            και ώρα <span class="label-line">${thesis.time}</span>.
        </div>

        <div class="section center">
            <p class="center">Στην συνεδρίαση ήταν παρόντα τα μέλη της Τριμελούς Επιτροπής, κ.κ.:</p>
            <ol class="center-list">
                ${grades.map(g => `<li>${g.full_name}</li>`).join('')}
            </ol>
            <p class="center">οι οποίοι ορίσθηκαν από την Συνέλευση του ΤΜΗΥΠ, στην συνεδρίαση της με αριθμό "${thesis.protocol_number}"</p>
        </div>

        <div class="section center">
                <div style="margin-top: 8px;">Ο/Η φοιτητής/τρια κ <span>${thesis.student_name} ${thesis.student_surname}</span>
                    ανέπτυξε το θέμα της Διπλωματικής του/της Εργασίας με τίτλο: </div>
                <div style="margin-top: 8px;"><span>"${thesis.title}"</span>.</div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;">Στην συνέχεια υποβλήθηκαν ερωτήσεις στον υποψήφιο από τα μέλη της Τριμελούς Επιτροπής και τους άλλους</div>
            <div style="margin-top: 8px;">παρευρισκόμενους, προκειμένου να διαμορφώσουν σαφή άποψη για το περιεχόμενο της εργασίας, για την</div>
            <div style="margin-top: 8px;"> επιστημονική συγκρότηση του μεταπτυχιακού φοιτητή.</div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;"> Μετά το τέλος της ανάπτυξης της εργασίας του και των ερωτήσεων, ο υποψήφιος αποχωρεί.</div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;">Ο Επιβλέπων καθηγητής κ. <span>${grades.find(g => g.role === 'Επιβλέπων')?.full_name}</span>, προτείνει στα μέλη της Τριμελούς</div>
            <div style="margin-top: 8px;">Επιτροπής, να ψηφίσουν για το αν εγκρίνεται η διπλωματική εργασία του/της <span>${thesis.student_name} ${thesis.student_surname}</span></div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;"> Τα μέλη της Τριμελούς Επιτροπής, ψηφίζουν κατ' αλφαβητική σειρά:</div>
            <ol class="center-list">
                ${grades
                    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'el'))
                    .map(g => `<li>${g.full_name}</li>`)
                    .join('')
                }
            </ol>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;"> υπέρ της εγκρίσεως της Διπλωματικής Εργασίας του φοιτητή <span>${thesis.student_name} ${thesis.student_surname}</span>,</div>
            <div style="margin-top: 8px;"> επειδή θεωρούν επιστημονικά επαρκή και το περεχόμενό της ανταποκρίνεται στο θέμα που του δόθηκε.</div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;"> Μετά την έγκριση, ο εισηγητής κ. <span>${grades.find(g => g.role === 'Επιβλέπων')?.full_name}</span>, προτείνει στα μέλη της Τριμελούς Επιτροπής,</div>
            <div style="margin-top: 8px;"> να απονεμηθεί στο/στη φοιτητή/φοιτήτρια κ. <span>${thesis.student_name} ${thesis.student_surname}</span> ο βαθμός <span>${thesis.final_grade}</span></div>
        </div>

        <div class="section center">
            <div style="margin-top: 8px;">Τα μέλη της Τριμελούς Επιτροπής, απομένουν την παρακάτω βαθμολογία: </div>
            <div style="margin-top: 8px;"> 
        </div>

        <div class="section">
            <p class="center"><strong>ΟΝΟΜΑΤΕΠΩΝΥΜΟ - ΙΔΙΟΤΗΤΑ - ΒΑΘΜΟΣ</strong></p>
            ${grades.map(g => `<p class="center">${g.full_name} - ${g.role} - ${g.grade}</p>`).join('')}
        </div>

        <div class="section center">
            <div style="margin-top: 8px;"> Μετά την έγκριση και την απονομή του βαθμού <span>${thesis.final_grade}</span>, η Τριμελής Επιτροπή, προτείνει να </div>
            <div style="margin-top: 8px;">προχωρήσει στην διαδικασία για να ανακηρύξει τον κ. ${thesis.student_name} ${thesis.student_surname}, σε</div>
            <div style="margin-top: 8px;">διπλωματούχο του Προγράμματος Σπουδών του «ΤΜΗΜΑΤΟΣ ΜΗΧΑΝΙΚΩΝ, ΗΛΕΚΤΡΟΝΙΚΩΝ </div>
            <div style="margin-top: 8px;">ΥΠΟΛΟΓΙΣΤΩΝ ΚΑΙ ΠΛΗΡΟΦΟΡΙΚΗΣ ΠΑΝΕΠΙΣΤΗΜΙΟΥ ΠΑΤΡΩΝ» και να του απονέμει το Δίπλωμα </div>
            <div style="margin-top: 8px;">Μηχανικού Η/Υ το οποίο αναγνωρίζεται ως Ενιαίος Τίτλος Σπουδών Μεταπτυχιακού Επιπέδου.</div>
        </div>
    </body>
    </html>
    `;
}

router.get('/generate-protocol/:thesis_id', async (req, res) => {
    try {
        const html = await createProtocolHtml(req.params.thesis_id);    // Generate the protocol HTML
        res.setHeader('Content-Type', 'text/html'); // Set the response type (HTML) to the client 
        res.send(html); // Send the generated HTML to the client
    } catch (err) {
        console.error(err);
        res.status(500).send('Σφάλμα κατά τη δημιουργία του πρακτικού.');
    }
});

// Export the router and the createProtocolHtml function
module.exports = {
    router,
    createProtocolHtml
};
