let filteredAnnouncements = []; // Variable to store filtered announcements, used to extract JSON and XML
let animationFrameId = null;    // Variable to store the ID of the animation frame, to see if there is an animation that is running and be able to stop it

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('carouselContainer');

    fetch('/api/announcements')
        .then(response => response.json())
        .then(announcements => {
            // Check if the response is an array, else return an error
            if (!Array.isArray(announcements)) {
                console.error("Invalid data from server");
                return;
            }

            container.style.display = 'flex';               // The container is displayed as flex, means the cards will be displayed in a row
            container.style.justifyContent = 'flex-start';  // The cards will be aligned to the left
            container.style.alignItems = 'initial';         // The cards will not be stretched

            // Check if announcements array is empty
            if (announcements.length === 0) {
                handleNoAnnouncements(container);  // Call the function to handle no announcements 
                return;                            // Exit if there are no announcements
            }   

            cardCreate(container, announcements);  // Create announcement cards
            
            // Add small delay to ensure CSS is fully applied before starting scroll
            setTimeout(() => {
                // Only start scrolling if there are more than 4 cards
                if (container.children.length > 4) {
                    startScrolling(container);             // Start the scrolling effect
                }
            }, 300);
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
});

let pressed = 0; // Variable to track if the button has been pressed before

// This part handles the press of the button to show the date range filter
document.getElementById('timeRangeButton').addEventListener('click', () => {
    const dateRangeFilter = document.getElementById('dateRangeFilter'); // Get the date range filter element, in order to be able to display it 
    dateRangeFilter.style.display = 'flex';     // The container is displayed as flex, means the cards will be displayed in a row
    pressed += 1; // Add one to the pressed state
    if (pressed >= 1) {
        enableExaminationEdit(); // If the button is pressed for the second time we are now editing the date time and not just setting them 
    }
});

// This part handles the application of the filters
document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const container = document.getElementById("carouselContainer");
    const jsonFile = document.getElementById("jsonFile");
    const xmlFile = document.getElementById("xmlFile");

    // If no start or end date is selected, show an alert
    if (!start || !end) {
        showCustomAlert("Επιλέξτε και τις δύο ημερομηνίες.");
        return;
    }
    
    // Convert to Date objects for comparison
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    // If the start date is after the end date, show an alert
    if (startDateObj > endDateObj) {
        showCustomAlert("Η ημερομηνία έναρξης πρέπει να είναι πριν ή ίση με την ημερομηνία λήξης.");
        return;
    }

    lockExaminationFields(); // Lock the fields after submission
    // Show the export buttons
    document.getElementById("exportFilter").style.display = 'block'; // Show the parent container
    jsonFile.style.display = 'inline-block';
    xmlFile.style.display = 'inline-block';

    // Fetch announcements based on the selected date range
    fetch(`/api/announcements?start=${start}&end=${end}`)
            .then(response => response.json())
            .then(announcements => {
                if (!Array.isArray(announcements)) {
                    console.error("Invalid data from server");
                    return;
                }
            
                filteredAnnouncements = announcements;
                container.innerHTML = ""; // Clear the container before adding new cards
                // This is if there are no announcements in the selected dates 
                if (announcements.length === 0) {
                    handleNoAnnouncements(container);
                    return;
                }

                cardCreate(container, announcements);  // Create announcement cards
                // If the animation is already running, restart it with the new cards
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                
                // Add small delay for mobile CSS application
                setTimeout(() => {
                    // Only start scrolling if there are more than 4 cards
                    if (container.children.length > 4) {
                        startScrolling(container);              // Start the scrolling effect
                    }
                }, 100);
            })
            .catch(err => {
                console.error("Fetch error:", err);
            });
});

// Function that handles the non existance of announcements
function handleNoAnnouncements(container) {
        const start = document.getElementById("startDate").value;
        const end = document.getElementById("endDate").value;
        container.style.display = 'flex';
        container.style.justifyContent = 'flex-start';
        container.style.alignItems = 'initial';

        // Create static "no announcements" card
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';

        // This is the styling of the cards, that is according to the other cards
        const noAnnouncementsCard = document.createElement('div');
        noAnnouncementsCard.className = 'card shadow-sm';
        noAnnouncementsCard.style.flex = '0 0 auto';
        noAnnouncementsCard.style.minWidth = '250px';
        noAnnouncementsCard.style.width = '400px';
        noAnnouncementsCard.style.height = '250px';
        noAnnouncementsCard.style.marginRight = '2rem';
        noAnnouncementsCard.style.display = 'flex';
        noAnnouncementsCard.style.flexDirection = 'column';
        noAnnouncementsCard.style.justifyContent = 'center';
        noAnnouncementsCard.style.alignItems = 'center';
        noAnnouncementsCard.style.textAlign = 'center';
        noAnnouncementsCard.style.padding = '1rem';

        // Create a div that will hold the card, if there are dates that where selected, we display them 
        noAnnouncementsCard.innerHTML = `
            <div class="card-body text-center d-flex flex-column justify-content-between align-items-center h-100" style="padding: 1rem; white-space: normal; overflow-wrap: break-word; word-break: break-word; max-width: 100%;">
                <h4 class="card-title text-bordeaux">Δεν Βρέθηκαν Αποτελέσματα</h4>
                <p class="card-text text-muted">
                    Δεν υπάρχουν ανακοινώσεις διπλωματικών εργασιών για το συγκεκριμένο χρονικό διάστημα.
                </p>
                ${
                    start && end
                        ? `<p class="card-text">
                            <small class="text-muted">Εύρος: ${start} έως ${end}</small>
                            </p>`
                        : ""
                }
            </div>
        `;
        container.appendChild(noAnnouncementsCard); // The card is added to the container
    }

// Function that starts the scrolling effect
function startScrolling(container) {
    const originalContent = container.innerHTML;    // Store the original content of the container
    const containerWidth = container.clientWidth;   // Get the width of the container
    let currentWidth = container.scrollWidth;       // Get the current width of the content inside the container
    const isMobile = window.innerWidth <= 768;      // Check if the screen is mobile size

    // If its a mobile device, we set the overflow to auto and don't duplicate content
    if (isMobile) {
        container.style.overflowX = 'auto';
        container.style.scrollBehavior = 'smooth';
        // Don't duplicate content on mobile - let users scroll naturally
        return;
    }

    // Only duplicate content for desktop infinite scroll
    // Repeat the content until it fills at least 3 times the container width
    while (currentWidth < containerWidth * 3) {
        container.innerHTML += originalContent;
        currentWidth = container.scrollWidth;
    }

    // If the width of the content is greater than the width of the container, start the scrolling effect
    if (container.scrollWidth > containerWidth) {
        let scrollSpeed = 1;

        // This function will scroll the content of the container, each frame moves 1 pixel
        function smoothScroll() {
            container.scrollLeft += scrollSpeed;
            // When the scroll position reaches the halfway point of the content, reset it to 0
            if (container.scrollLeft >= container.scrollWidth / 2) {
                container.scrollLeft = 0;
            }
            animationFrameId = requestAnimationFrame(smoothScroll);     // Recursive call
        }
        requestAnimationFrame(smoothScroll);    // This is what starts the scrolling
    } else {
        console.log('Not enough content to scroll');
    }
}

// Function that creates the cards
function cardCreate(container, announcements) {
    // First we define the container
    container.innerHTML = "";
    container.style.display = 'flex';
    container.style.justifyContent = 'flex-start';
    container.style.alignItems = 'initial';

    // Create one card for each announcement object
    announcements.forEach(announcement => {
        const card = document.createElement('div');
        // Define the class of the card, so it has the same styling as the other cards
        card.className = 'card shadow-sm mx-2';
        card.style.flex = '0 0 auto';
        card.innerHTML = `
            <div class="card-body d-flex flex-column justify-content-between h-100">
                <p class="card-title text-bordeaux">${announcement.thesis_title}</p>
                <div class="mt-auto">
                    <p class="card-text mb-0">${announcement.student_full_name}</p>
                    <p class="card-text mb-0">Ημέρα και ώρα: ${announcement.date.split('T')[0]} στις ${announcement.time}</p>
                    <p class="card-text mb-0">Παρουσιάζεται: ${announcement.location_or_link}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Check the number of cards, if more than 4 we add the scrollable class
    const cards = container.children.length;
    console.log(`Number of cards: ${cards}`);
    if (cards > 4) {
        container.classList.add('container-scrollable');
        container.style.justifyContent = 'flex-start';  // Left-aligned for scrolling
    } else {
        container.classList.remove('container-scrollable');
        container.style.justifyContent = 'center';      // Center-aligned when no scroll
    }
}

// Function for the successful submission of the thesis
function lockExaminationFields() {
    const fields = ['startDate', 'endDate']; // Array with the forms 'fields
    // Loop through the fields and disable them, also add styling
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('disabled', true);       // Disable so the user cannot change it
            input.classList.add('bordeaux-outline');    // Add styling to the disabled button
        }
    });

    document.querySelector('#applyFiltersBtn').style.display = 'none';  // Hide the button
}

// Function to edit the examination details
function enableExaminationEdit() {
    const fields = ['startDate', 'endDate']; // Array with the forms 'fields
    // Loop through the fields and disable them, also add styling
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;                        // Enable the button again
            el.classList.remove('bordeaux-outline');    // Remove the styling for the disabled button 
        }
    });

    document.querySelector('#applyFiltersBtn').style.display = 'block';  // Show the button again
}

// Function to show a custom alert modal
function showCustomAlert(message) {
    const modal = document.getElementById('customAlert');               // Reference to the custom alert modal backdrop
    const messageBox = document.getElementById('customAlertMessage');   // Reference to the message box inside the modal
    const okBtn = document.getElementById('customAlertOk');             // Reference to the OK button inside the modal

    messageBox.textContent = message;       // Set the message text
    modal.style.display = 'flex';           // Show the modal by changing its display to flex

    // Hide the modal when OK is clicked
    okBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// This handles the JSON file creation 
document.getElementById("jsonFile").addEventListener("click", () => {
    // This keeps only the date part of the string
    const simplified = filteredAnnouncements.map(a => ({
        ...a,
        date: a.date.split('T')[0] 
    }));

    const json = JSON.stringify(simplified, null, 2);   // Convert the filtered announcements to JSON format
    const blob = new Blob([json], { type: "application/json" });    // Create a blob object for the JSON file
    const url = URL.createObjectURL(blob);      // Create a temporary URL for the blob object
    const link = document.createElement("a");   // Create a link element
    link.href = url;                            // href of the link is set to the blob URL, in order to specify the file to download
    link.download = "announcements.json";       // Name the file
    link.click();                               // This is used in order to start the download
    URL.revokeObjectURL(url);                   // Revoke the object URL to free up memory
});

document.getElementById("xmlFile").addEventListener("click", () => {
    const xmlData = jsonToXml(filteredAnnouncements);   // Convert the filtered announcements to XML format
    const blob = new Blob([xmlData], { type: "application/xml" });    // Create a blob object for the XML file
    const url = URL.createObjectURL(blob);      // Create a temporary URL for the blob object
    const link = document.createElement("a");   // Create a link element
    link.href = url;                            // href of the link is set to the blob URL, in order to specify the file to download
    link.download = "announcements.xml";       // Name the file
    link.click();                               // This is used in order to start the download
    URL.revokeObjectURL(url);                   // Revoke the object URL to free up memory
});

// Function used to convert JSON to XML format
function jsonToXml(jsonArray) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<announcements>\n';        // This is the header of the XML file
    jsonArray.forEach(item => {
        xml += `  <announcement>\n`;    // A new xml element is created
        // Loop through each key in the item and create an XML element for it
        for (const key in item) {
            let value = item[key];
            // For the date, we only want the date part
            if (key === 'date' && typeof value === 'string') {
                value = value.split('T')[0];
            }
            xml += `    <${key}>${value}</${key}>\n`;
        }
        xml += `  </announcement>\n`;   // Close the announcement element
    });
    xml += '</announcements>';  // Close the root element
    return xml; // Return the XML string
}
