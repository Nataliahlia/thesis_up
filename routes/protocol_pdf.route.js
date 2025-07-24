const express = require('express');
const puppeteer = require('puppeteer'); // The library we use for the pdf creation 
const router = express.Router();
const { createProtocolHtml } = require('./protocol.route'); // We use the function from protocol.route.js, that creates the protocol HTML

router.get('/download-protocol/:thesis_id', async (req, res) => {
    const thesisId = req.params.thesis_id;  // Get the thesis ID from the request parameters

    try {
        const html = await createProtocolHtml(thesisId);    // Generate the protocol HTML
        // Create a new Puppeteer browser instance
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();   // Open a new page in the browser
        await page.setContent(html, { waitUntil: 'networkidle0' }); // Set the content of the page to the generated HTML

        // Generate the PDF from the page content
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
        });

        await browser.close();  // Close the browser instance

        // Set the response headers to indicate a PDF file download
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="praktiko_exetasis_${thesisId}.pdf"`
        });
        // Send the generated PDF as the response
        res.send(pdf);

    } catch (err) {
        console.error('Σφάλμα PDF Puppeteer:', err);
        res.status(500).send('Σφάλμα κατά τη δημιουργία PDF πρακτικού.');
    }
});

module.exports = router;
