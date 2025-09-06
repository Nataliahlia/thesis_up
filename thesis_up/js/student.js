// Student Dashboard JavaScript

// Global variables
let hasExaminationInfo = false;     // This is the variable that will be used to check if the datetime info has been uploaded
window.fromCompletedInfo = false;   // This variable will be used to check if the user came from the completed info section

document.addEventListener('DOMContentLoaded', function () {

    // Initialisation
    initializeSidebar(); 
    initializeUserInfo(); 
    initializeLogoutCustom(); 
    initializeSectionPersistence(); 
    initializeModalScope();    
    initializeMyThesisSection();
    initializeMyProfileEditSection();
    initializeThesisManagementSection();
    initializeBackButtonFunctionality();
    initializeEditExaminationButton();
    initializeDateValidation();

    // The helpers
    window.showCustomAlert = showCustomAlert;

    // Restore active section on reload
    const activeSection = sessionStorage.getItem('studentActiveSection'); // Get the saved section from the session storage
    console.log(activeSection); 
    if (activeSection && document.getElementById(activeSection)) {
        document.getElementById(activeSection).click();   // Simulate a click on the saved section to show it
    } else {
        document.getElementById('viewMyThesis').click();  // If no section is saved, show the default section -> handles starting page as well 
    }
});

// Sidebar Functionality
function initializeSidebar() {
    const toggleButton = document.querySelector('.navbar-toggler');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Set initial sidebar state
    sidebar.style.left = '-250px';
    mainContent.style.marginLeft = '0';

    // Add event listener to toggle button
    toggleButton.addEventListener('click', function () {
        if (sidebar.style.left === '0px') {
            sidebar.style.left = '-250px';
            mainContent.style.marginLeft = '0';
        } else {
            sidebar.style.left = '0px';
            mainContent.style.marginLeft = '250px';
        }
    });
}

// Get the User Info 
function initializeUserInfo() {
    // Send a GET request to the session-info endpoint
    fetch('/session-info')
        .then(res => res.json()) // JSON format response
        .then(data => {
            // Display the user's full name
            document.getElementById('connectedUserFullname').textContent = data.name + ' ' + data.surname; 
    })
    .catch(() => {
        // If there's an error, display a default message
        document.getElementById('connectedUserFullname').textContent = 'Επισκέπτης';
    });
}

// Handle the user logout 
function initializeLogoutCustom() {
    // Create the references to the elements of the modal  
    const logoutLink = document.getElementById('logoutLink');
    const logoutModal = document.getElementById('customLogout');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const closeLogoutBtn = document.getElementById('closeLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogoutCustom');

    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.style.display = 'flex'; // Show modal when the user chooses to logout 
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none'; // Hide modal
        });
    }

    if (closeLogoutBtn) {  
        closeLogoutBtn.addEventListener('click', function() {
            logoutModal.style.display = 'none'; // Hide modal
        });
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('studentActiveSection'); // Clear the saved section so next login starts from the default page
            window.location.href = '/logout'; // Go to the logout route
        });
    }
}

// Save active section on menu click
function initializeSectionPersistence() {
    ['viewMyThesis', 'editButton', 'manageThesis'].forEach(id => {
        const btn = document.getElementById(id);    // Get the button by its id
        if (btn) {
            btn.addEventListener('click', () => {
                sessionStorage.setItem('studentActiveSection', id);   // Save the id of the button in the local storage
            });
        }
    });
}

// Function to handle the display and the hiding of the back button
function initializeBackButtonFunctionality() {
    // Get the menu items that will be used to handle the back button
    const menuItems = [
        document.getElementById('viewMyThesis'),
        document.getElementById('manageThesis'),
        document.getElementById('editButton')
    ];

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // If the button was not pressed and the user choose something from the menu instead
            // We remove the back button and reset the global variable
            if (!window.fromCompletedInfo) {
                const backBtn = document.querySelector('#thesisList .btn-outline-bordeaux');
                if (backBtn) backBtn.remove();
                window.fromCompletedInfo = false;
            }
        });
    });
}

// Function used to handle the button that enables the editing of the examination info   
function initializeEditExaminationButton() {
    const editBtn = document.getElementById('editExaminationButton');
    if (editBtn) {
        editBtn.addEventListener('click', enableExaminationEdit);
    }
}

// Function to handle the examination date being after the current date 
function initializeDateValidation() {
    const dateInput = document.getElementById('dateOfExamination');
    if (dateInput) {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        
        // Optional: Add event listener for additional validation
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0); // Reset time to compare only dates
            
            if (selectedDate < todayDate) {
                alert('Δεν μπορείτε να επιλέξετε παρελθούσα ημερομηνία για την εξέταση.');
                this.value = ''; // Clear the invalid date
            }
        });
    }
}
// --------------------------------------------------------------------------------------- //
// My Thesis Functionality
function initializeMyThesisSection() {
    // Get the elements of the section
    const button = document.getElementById("viewMyThesis");
    const sidebar = document.getElementById("sidebar");
    const list = document.getElementById("thesisList");
    const title = document.getElementById("dashboardTitle");

    if (button) {
        button.addEventListener('click', async function(e) {
            console.log("Button clicked");
            e.preventDefault(); // Prevent page reload
            hideAllSections(); // Hide all sections before showing the form
            list.style.display = "block"; // Show the form
            title.style.display = "none"; // Hide the heading
            sidebar.style.left = "-250px"; // Move sidebar out of view
            document.querySelector('.main-content').style.marginLeft = "0"; // Reset main content position, removes the margin that was applied when sidebar was visible
            await fetchThesisDetails();   // Call the function to fetch and display the thesis details
        });
    }
}

async function fetchThesisDetails() {
    try {
        const thesis = await getThesisDetails(); // Call the function to get the thesis details

        // Only proceed if thesis exists
        if (thesis) {
            const theThesis = document.getElementById('myThesis');
            theThesis.innerHTML = ''; // Clear old content

            // Call the function that creates the thesis details element and appends it to the div
            showThesisDetails(theThesis, thesis);
            // Call the function that creates the back button if coming from the completed thesis info page
            createBackButton(thesis);
        }
    } catch (error) {
        showCustomAlert(error.message || 'Σφάλμα κατά την ανάκτηση των στοιχείων της διπλωματικής.');
    }
}

// Get thesis details function 
async function getThesisDetails() {
    const res = await fetch('/mythesis-details');
    const mythesis = await res.json();
    if (!res.ok) throw new Error(mythesis?.error || 'Σφάλμα');

    // Check to see if there is a thesis assigned to the student
    if (!mythesis || mythesis.length === 0) {
        // Message shown if no thesis is assigned
        showCustomAlert("Δεν έχει ορισθεί ακόμη διπλωματική εργασία.");
        return;
    } else {
        return mythesis[0]; // Array -> needs to access the elements
    }
}

// Function that creates the thesis details element and appends it to the div
function showThesisDetails(container, thesis) {
    // Call the function to create the progression bar
    const { stageNumber, stageLabel, progressPercent } = createProgressBar(thesis);

    const item = document.createElement('div');
    item.className = 'list-group-item';
    // No change when hovering ->  style="pointer-events: none;"
    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center" style="min-height: 60px; pointer-events: none;">
            <h3 class="my-auto"><strong>Θέμα:</strong> ${thesis.title}</h3>
            <span class="btn bordeaux-outline btn-sm my-auto rounded-pill">${thesis.state}</span>
        </div>
        <hr class="my-3">
        <p><strong class="text-bordeaux">Περιγραφή:</strong><br> ${thesis.description ? thesis.description : 'Δεν έχει ορισθεί περιγραφή'}</p>
        <p><strong class="text-bordeaux">Συνημμένο Αρχείο Περιγραφής:</strong> ${thesis.pdf ? thesis.pdf : 'Δεν έχει υποβληθεί αρχείο'}</p>
        <p><strong class="text-bordeaux">Επιβλέπων Καθηγητής:</strong> ${thesis.full_instructor_name ? thesis.full_instructor_name : 'Δεν έχει ορισθεί επιβλέπων καθηγητής'}</p>
        <p><strong class="text-bordeaux">Μέλη Τριμελούς:</strong> ${(thesis.member1 && thesis.member2) ? `${thesis.full_instructor_name} (Επιβλέπων), ${thesis.full_mentor_name}, ${thesis.full_mentortwo_name}` : 'Δεν έχουν ορισθεί μέλη τριμελούς'}</p>
        <p>
        ${
            thesis.days_since_activation === 0
            ? 'Η επίσημη ανάθεση έγινε σήμερα'
            : thesis.days_since_activation
                ? thesis.days_since_activation + ' ημέρες έχουν παρέλθει από την επίσημη ανάθεση'
                : 'Δεν έχει γίνει ακόμη επίσημη ανάθεση'
        }
        </p>

        <div class="mt-3">
        <hr>
            <div class="mt-3">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-tasks text-bordeaux me-2"></i>
                    <strong class="text-bordeaux">Πρόοδος Διπλωματικής:</strong>
                </div>
                <div class="progress" style="height: 22px;">
                    <div class="progress-bar bg-bordeaux fw-bold" role="progressbar" style="width: ${progressPercent}%;">
                        Στάδιο ${stageNumber} από 5: ${stageLabel}
                    </div>
                </div>
            </div>
    `;
    container.appendChild(item);
    container.style.display = 'block'; // Make sure the div is visible
}

// function that handles the progression bar display according to the stage of the thesis
function createProgressBar(thesis) {
    // Create the progression bar 
    let stageNumber = 0;    // This is used for the stage number
    let stageLabel = thesis.state;  // This is used for the stage name
    let progressPercent = 0;  // This is used for the progress percentage

    switch (thesis.state) {
        case "Υπό Ανάθεση":
            stageNumber = 2;
            stageLabel = "Υπό Ανάθεση";
            break;
        case "Ενεργή":
            stageNumber = 3;
            stageLabel = "Ενεργή";
            break;
        case "Υπό Εξέταση":
            stageNumber = 4;
            stageLabel = "Υπό Εξέταση";
            break;
        case "Περατωμένη":
            stageNumber = 5;
            stageLabel = "Περατωμένη";
            break;
    }

    progressPercent = (stageNumber / 5) * 100;  // Calculate the progress percentage, according to the stage number
    return { stageNumber, stageLabel, progressPercent };
}

// Call the function that creates the back button if coming from the completed thesis info page
function createBackButton() {
    // Check if the global var for the back button is set to true
    if (window.fromCompletedInfo) {
        // Get the div used for the thesis list
        const thesisList = document.getElementById('thesisList');

        // Wrapper to center the button
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'd-flex justify-content-center mt-3';

        // Create the back button with its styling
        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-outline-bordeaux';
        backBtn.innerHTML = `<i class="fa-solid fa-arrow-left me-2"></i> Επιστροφή στη Διαχείριση Διπλωματικής`;

        // Add an event listener to the back button
        backBtn.addEventListener('click', function () {
            document.getElementById('manageThesis').click();
            backBtn.remove(); // Remove the button after clicking
        });

        // Append the button wrapper to the thesis list
        btnWrapper.appendChild(backBtn);
        thesisList.appendChild(btnWrapper);

        window.fromCompletedInfo = false; // Reset flag
    }
}

// --------------------------------------------------------------------------------------- //
// My Profile Edit Functionality
function initializeMyProfileEditSection() {
    // Show the form when the button is clicked and later handle the form submission using AJAX
    const button = document.getElementById("editButton");
    const sidebar = document.getElementById("sidebar");
    const editContainer = document.getElementById("editProfile");
    const title = document.getElementById("dashboardTitle");
    console.log("Script loaded and DOM is ready");

    if (button) {
        button.addEventListener('click', async function(e) {
            console.log("Button clicked");
            e.preventDefault(); // Prevent page reload
            hideAllSections(); // Hide all sections before showing the form
            editContainer.style.display = "block"; // Show the form in the container
            title.style.display = "none"; // Hide the heading
            sidebar.style.left = "-250px"; // Move sidebar out of view
            document.querySelector('.main-content').style.marginLeft = "0"; // Reset main content position, removes the margin that was applied when sidebar was visible
            await fetchProfileData(); // Call the function to fetch the profile data and fill the form
            addSubmitListener(); // Add the submit listener to the form
        });
    }
}

async function fetchProfileData() {    
    try {
        const studentInfo = await getProfileData(); // Call the function to get the student profile details

        // Populate the form with the fetched data
        document.getElementById("editName").value = studentInfo.name;
        document.getElementById("editSurname").value = studentInfo.surname;
        document.getElementById("editEmail").value = studentInfo.email;
        document.getElementById("editStreet").value = studentInfo.street;
        document.getElementById("editStreetNumber").value = studentInfo.streetNumber;
        document.getElementById("editPostalCode").value = studentInfo.postalCode;
        document.getElementById("editCity").value = studentInfo.city;
        document.getElementById("editMobile").value = studentInfo.mobileTelephone;
        document.getElementById("editLandline").value = studentInfo.landlineTelephone;
    } catch (error) {
        showCustomAlert(error.message || 'Σφάλμα κατά την ανάκτηση των στοιχείων χρήστη.');
    }
}

// Function to get the profile data (get request)
async function getProfileData() {
    const res = await fetch('/myprofile-edit');
    const studentInfo = await res.json();
    if (!res.ok) throw new Error(studentInfo?.error || 'Σφάλμα');

    // Check to see if there is a profile assigned to the student
    if (!studentInfo || studentInfo.length === 0) {
        // Message shown if no profile is found
        showCustomAlert("Δεν βρέθηκαν στοιχεία προφίλ.");
        return;
    } else {
        return studentInfo; 
    }
}

// Function to handle the form submission 
function addSubmitListener() {
    // Fetch to submit the form data
    const editForm = document.getElementById("editForm"); // Reference to the form element
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent the default form submission

        // Collect form data
        const formData = new FormData(editForm);                // Create a FormData object from the form, which collects all the inputs inside the form
        const data = Object.fromEntries(formData.entries());    // Convert FormData to a regular object, lets the use of JSON.stringify

        try {
            const result = await updateProfileData(data); // Call the function to update the profile data

            // If the update is successful, show a custom alert
            if (result.success) {   // True as a response from the server -> success: true
                // Show custom alert
                showCustomAlert('Τα στοιχεία ενημερώθηκαν επιτυχώς!');  
            } else {
                // Show custom alert with error message
                showCustomAlert('Σφάλμα κατά την ενημέρωση των στοιχείων. Παρακαλώ δοκιμάστε ξανά.');
            }

        } catch (error) {
            showCustomAlert('Σφάλμα κατά την αποστολή των δεδομένων.'); // Show an alert if there's an error
            return;
        }
    });
}

// Function to update the profile data (post request)
async function updateProfileData(data) {
    const res = await fetch('/myprofile-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.error || 'Σφάλμα');
    return result;
}

// --------------------------------------------------------------------------------------- //
// Thesis Management Functionality
function initializeThesisManagementSection() {
    // Show the form when the button is clicked and later handle the form submission using AJAX
    const button = document.getElementById("manageThesis");
    const sidebar = document.getElementById("sidebar");
    const div = document.getElementById("thesisManagement");
    const title = document.getElementById("dashboardTitle");

    if (button) {
        button.addEventListener('click', async function(e) {
            console.log("Button clicked");
            e.preventDefault(); // Prevent page reload
            hideAllSections(); // Hide all sections before showing the form
            div.style.display = "block"; // Show the form in the container
            title.style.display = "none"; // Hide the heading
            sidebar.style.left = "-250px"; // Move sidebar out of view
            document.querySelector('.main-content').style.marginLeft = "0"; // Reset main content position, removes the margin that was applied when sidebar was visible
            
            const thesis = await getThesisDetails();   // Call the function to fetch and display the thesis details
            
            if (thesis.state === 'Υπό Εξέταση') {
                await underExaminationThesisContent(thesis); // Call the function that handles under examination thesis
            } else if (thesis.state === 'Περατωμένη') {
                completedThesisContent(thesis); // Call the function that handles completed thesis
            } else if (thesis.state === "Υπό Ανάθεση") {
                await underAssignmentThesisContent(thesis); // Call the function that handles under assignment thesis
            } else if (thesis.state === "Ενεργή") {
                activeThesisContent(thesis); // Call the function that handles active thesis
            } 
        });
    }
}

// --------------------------------------------------------------------------------------- //
// Υπό Εξέταση //

// Function that handles under examination thesis
async function underExaminationThesisContent(thesis) {
    // Handle the file and links upload
    const form = document.getElementById('thesisManagementForm');
    form.style.display = 'block'; // Show the form if the thesis is under review
    const timeForm = document.getElementById("timeOfExaminationForm");  
    timeForm.style.display = 'block'; // Show the time of examination form  

    examinationTypeRendering(); // Call the function that handles the rendering of the examination type inputs
    uploadedFile(thesis); // Call the function to upload the file

    // Check if the thesis has a draft file
    if (thesis.draft_file) {
        renderUploadedFile(thesis.draft_file); // Call the function to render the uploaded file
    }

    // Check if the user has uploaded additional links
    if (thesis.additional_links) {
        let linksArray = [];
        try {
            linksArray = JSON.parse(thesis.additional_links);   // Convert the JSON string to an array
        } catch (err) {
            linksArray = [];
        }

        // If there are links
        if (Array.isArray(linksArray) && linksArray.length > 0) {
            // Call the function to render the submitted links
            renderSubmittedLinks(linksArray, thesis);
        }
    } 

    // Handle the details of the examination form
    timeForm.addEventListener('submit', async function (e) {  
        e.preventDefault();     // Prevent the default form submission
        await submitExaminationDetails(thesis); // Call function to submit the examination details
    });

    await getExaminationInfo(thesis); // Call the function to get the examination info
    await showNimertisLinks(thesis); // Call the function to show the nimertis links
}

// Render the type and link
function examinationTypeRendering() {
    // The variables that will be used
    const type = document.getElementById('examinationType');
    const detailsContainer = document.getElementById('examinationDetailsContainer');
    // Add a listener for the event change on the type select element
    type.addEventListener('change', () => {
        const selectedValue = type.value;       // Get the value of the selected option
        detailsContainer.innerHTML = '';        // Clear previous content

        if (selectedValue === 'Διά Ζώσης') {
            // Add room input
            const label = document.createElement('label');
            label.setAttribute('for', 'examinationRoom');
            label.className = 'form-label';
            label.textContent = 'Αίθουσα Εξέτασης';

            // Create the input element for the room
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'examinationRoom';
            input.name = 'examinationRoom';
            input.className = 'form-control';
            input.placeholder = 'π.χ. Αίθουσα Β1';
            input.required = true;

            // Append the label and input to the details container
            detailsContainer.appendChild(label);
            detailsContainer.appendChild(input);
        } else if (selectedValue === 'Διαδικτυακά') {
            // Add online link input
            const label = document.createElement('label');
            label.setAttribute('for', 'examinationLink');
            label.className = 'form-label';
            label.textContent = 'Σύνδεσμος Εξέτασης';

            // Create the input element for the link
            const input = document.createElement('input');
            input.type = 'url';
            input.id = 'examinationLink';
            input.name = 'examinationLink';
            input.className = 'form-control';
            input.placeholder = 'π.χ. https://upatras.zoom.us/...';
            input.required = true;

            // Append the label and input to the details container
            detailsContainer.appendChild(label);
            detailsContainer.appendChild(input);
        }
    })
}

// Function file uploading
function uploadedFile(thesis) {
    // Get reference to the form and handle submission
    const form = document.getElementById('thesisManagementForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();         // Prevent the default form submission

        // Finds all the links the user has added in the form
        const links = document.querySelectorAll('#dynamicLinksArea input[type="url"]');
        // Check if at least one link is filled
        const hasLinks = Array.from(links).some(link => link.value.trim() !== '');
        // Check to see if a file is uploaded now or has been uploaded previously
        const fileInput = document.getElementById('progressFile');
        // Check if the student has uploaded a new file now
        const fileUploadedNow = fileInput && fileInput.files.length > 0;
        // Check if a file has been uploaded previously
        const filePreviouslyUploaded = !!(thesis && thesis.draft_file);

        // If no file is uploaded now and no file has been uploaded previously, and there are links, show an alert
        if (!fileUploadedNow && !filePreviouslyUploaded && hasLinks) {
            showCustomAlert('Πρέπει πρώτα να υποβάλλεται αρχείο, πριν προσθέσετε σύνδεσμο/ους');
            return;
        }

        // Finds all the links the user has added in the form
        const hasEmptyLink = Array.from(links).some(link => link.value.trim() === '');
        if (hasEmptyLink) {
            showCustomAlert('Προσοχή! Υποβάλλατε κενό σύνδεσμο. Προσπαθήστε για νέα έγκυρη υποβολή.');
            return;
        }
        const formData = new FormData(form); // This is used to collect all the inputs inside the form, this data will be sent to the server
        
        fetch('/under-examination-upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                showCustomAlert("Επιτυχής Υποβολή");

                // Clear the dynamic links area
                const inputCards = document.querySelectorAll('#dynamicLinksArea .link-card');
                inputCards.forEach(card => card.remove());

                // Redo the fetch to update the thesis details, without reloading the page
                fetch('/mythesis-details')
                    .then(res => res.json())
                    .then(data => {
                        const updatedThesis = data[0];
                        console.log('Updated thesis details:', updatedThesis);
                        thesis = updatedThesis;

                        if (updatedThesis.additional_links) {
                            let linksArray = [];
                            try {
                                linksArray = JSON.parse(updatedThesis.additional_links);
                            } catch (err) {
                                linksArray = [];
                            }
            
                            // Call the function to render the submitted links
                            renderSubmittedLinks(linksArray, thesis); 
                        }
                        if (updatedThesis.draft_file) {
                            // Call the function to render the uploaded file
                            renderUploadedFile(updatedThesis.draft_file);
                        }
                    });
            } else {
                showCustomAlert("Αποτυχία αποθήκευσης. Δοκιμάστε ξανά.");
            }
        })
        .catch(err => {
            console.error('Upload error:', err);
            showCustomAlert("Σφάλμα κατά την αποστολή.");
        });
    });
}

// Function to submit the under examination details
async function submitExaminationDetails(thesis) {
    // Get the values from the form inputs
    const date = document.getElementById('dateOfExamination').value;
    const type = document.getElementById('examinationType').value;
    const time = document.getElementById('timeOfExamination').value;
    // Get the thesis ID from the global variable
    const thesisId = thesis.thesis_id; 
    const detailsContainer = document.getElementById('examinationDetailsContainer');    // No .value here, because it is a container for the inputs and not an input
    const room = document.getElementById('examinationRoom')?.value;
    const link = document.getElementById('examinationLink')?.value;
    const location_or_link = type === 'Διά Ζώσης' ? document.getElementById('examinationRoom')?.value : document.getElementById('examinationLink')?.value;

    // Check to see if there is a missing field
    if (!date || !thesisId || !type || !time || !location_or_link ) {
        showCustomAlert('Παρακαλώ συμπληρώστε όλα τα πεδία.');
        return;
    }

    // Prepare the data to be sent, prepare the JSON object
    const data = {
        thesis_id: thesisId,
        date: date,
        time: time,
        type: type,
        location_or_link: location_or_link
    };

    // According to if the info has been uploaded before and its just a change - update
    const url = hasExaminationInfo ? '/update-examination-info' : '/submit-examination-info';
    try {
        // The post request to submit the examination information
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json().catch(() => ({}));
   
        if (result.success) {
            hasExaminationInfo = true; // Set the flag to true after successful submission
            showCustomAlert('Η ημερομηνία και ο τρόπος εξέτασης αποθηκεύτηκαν.');
            lockExaminationFields();    // Lock the fields after submission -> user can't change them 
            console.log('Επιτυχής αποθήκευση των στοιχείων εξέτασης.');
        } else {
            showCustomAlert('Αποτυχία αποθήκευσης. Προσπαθήστε ξανά.');
        }

    } catch (error) {
        console.error(error);
        showCustomAlert('Σφάλμα κατά την αποστολή των δεδομένων.');
    }
}

// Function to get the examination info (get request)
async function getExaminationInfo(thesis) {
    // Used to get the date, time etc that the user previously uploaded
    try {
        const res = await fetch(`/get-examination-info/${thesis.thesis_id}`);
        const result = await res.json();

        if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
        if (!result || !result.data) {
            // Because this is the point where the check happens
            // Here we check if the user has uploaded exam info before
            console.log('Δεν υπάρχουν ακόμη στοιχεία εξέτασης.');
            return;
        }
        
        // Set the flag to true if examination info is available//
        // if the examination info is available it will be true for sure
        hasExaminationInfo = true; 

        const { date, time, type, location_or_link } = result.data;     // Get the server answer   
        document.getElementById('dateOfExamination').value = date.split('T')[0];    // Extract just the date, not the time
        document.getElementById('timeOfExamination').value = time;
        document.getElementById('examinationType').value = type;
        const event = new Event('change');   // This is used to trigger the change event on the select element
        // Dispatch the event to trigger the change event listener, used to add the inputs dynamically 
        document.getElementById('examinationType').dispatchEvent(event);

        // Gets the type and shows the correct field -> location_or_link
        setTimeout(() => {
            if (type === 'Διά Ζώσης') {
                document.getElementById('examinationRoom').value = location_or_link;
            } else if (type === 'Διαδικτυακά') {
                document.getElementById('examinationLink').value = location_or_link;
            }

            // Lock fields regardless of type, and completely hide edit button if uploaded
            if (state === 'uploaded') {
                lockExaminationFieldsPermanently();
            } else {
                lockExaminationFields();
            }
        } , 100); // Delay to ensure the input is rendered before setting its value
    } catch (error) {
        showCustomAlert(error.message || 'Σφάλμα κατά την ανάκτηση των στοιχείων εξέτασης.');
    }             
}

// Function to show the Nimertis link
async function showNimertisLinks(thesis) {
    const gradesData = await fetchGrades(thesis);
    const grades = gradesData.grades;
    // The followings are used to show the nimertis link if it is already submitted
    // and to allow the user to submit it if it is not submitted yet
    const existingNimertis = thesis?.nimertis_link || '';
    const isReadonly = existingNimertis ? 'readonly' : '';
    const hideSaveBtn = existingNimertis ? 'style="display: none;"' : '';
    const outlineClass = existingNimertis ? 'bordeaux-outline' : '';

    const gradesCard = document.getElementById('gradesCard');

    if (Array.isArray(grades) && grades.length > 0) {
        gradesCard.style.display = 'block'; // Display the grades card (protocol etc), only if there are grades uploaded from the professors
        // Create a container for the protocol content
        // if the 3 grades have been submitted
        const gradesInfo = document.getElementById('gradesInfo');
        gradesInfo.innerHTML = `
            <div class="my-3"></div>
            <p>Το πρακτικό της εξέτασης έχει ολοκληρωθεί και μπορείτε να δείτε συνοπτικά τις αξιολογήσεις σας παρακάτω:</p>
            <ul>
            ${grades.map(grade => {
                const isInstructor = thesis && grade.professor_full_name === thesis.full_instructor_name;
                const roleText = isInstructor ? ' (Επιβλέπων)' : '';
                return `<li><strong>${grade.professor_full_name}${roleText}:</strong> ${grade.grade}</li>`;
            }).join('')}
            </ul>
            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Αναλυτικά το αρχείο πρακτικού εξέτασης είναι διαθέσιμο:</p>
                </div>
                <button class="btn btn-outline-bordeaux w-100 ms-2" id="downloadProtocolBtn">
                    Εμφάνιση Πρακτικού σε μορφή HTML
                </button>
            </div>

            <!-- On click event for the download button, so the function is called -->
            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Μπορείτε να εξάγετε το αρχείο και σε μορφή PDF:</p>
                </div>
                <button class="btn btn-outline-bordeaux w-100 ms-2" id="downloadProtocolPdfBtn">
                    Κατέβασε το Πρακτικό σε PDF
                </button>
            </div>

            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Καταχωρήστε τον σύνδεσμο για το αποθετήριο Νημερτής:</p>
                </div>
                <div class="d-flex flex-grow-1 gap-2" style="min-width: 330px;">
                    <input type="text" id="nimertisLink" class="form-control ms-2 me-2 w-50 ${outlineClass}" placeholder="https://nimertis.example.com" value="${existingNimertis}" ${isReadonly} />
                    <button id="saveNimertisBtn" class="btn btn-outline-bordeaux w-50 " ${hideSaveBtn}>
                        Καταχώρηση
                    </button>
                    <button id="editNimertisBtn" class="btn btn-outline-bordeaux ms-2 w-50" ${existingNimertis ? '' : 'style="display: none;"'}>
                        Αλλαγή
                    </button>
                </div>
            </div>
        `;
        // Add the event listener for the download button   
        addDownloadListener(thesis);
        // Add the event listener for the download PDF button
        addDownloadPdfListener(thesis);
        // Add the event listener for the nimertis link
        addNimertisLinkListener(thesis);
    }
}

// Function used to fetch the grades data and return it
async function fetchGrades(thesis) {
    const thesisId = thesis.thesis_id;
    try {
        const res = await fetch(`/get-grades/${thesisId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error(err);
        showCustomAlert('Σφάλμα κατά την ανάκτηση βαθμολογιών.');
        return { events: [] };
    }
}

// Listener for the download button
function addDownloadListener(thesis) {
    const downloadBtn = document.getElementById('downloadProtocolBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const thesisId = thesis.thesis_id;
            console.log('Download button clicked for thesis ID:', thesisId);
            if (thesisId) {
                window.open(`/generate-protocol/${thesisId}`, '_blank');
            } else {
                showCustomAlert('Σφάλμα: Δεν εντοπίστηκε διπλωματική εργασία.');
            }
        });
    }
}

// Listener for the download PDF button
function addDownloadPdfListener(thesis) {
    const btn = document.getElementById('downloadProtocolPdfBtn');
    if (!btn) return;
    btn.addEventListener('click', () => downloadPDF(thesis));
}

// Listener for the Nimertis Link
function addNimertisLinkListener(thesis) {
    // Get the DOM elements that are used for the nimertis link functionality
    const saveBtn = document.getElementById('saveNimertisBtn');
    const linkInput = document.getElementById('nimertisLink');
    const editBtn = document.getElementById('editNimertisBtn');

    // Edit link button
    if (editBtn && linkInput) {
        // When the user presses the edit nimertis link button
        editBtn.addEventListener('click', () => {
            linkInput.removeAttribute('readonly');  // Remove the readonly attribute, so the user can change it 
            linkInput.classList.remove('bordeaux-outline'); //  Remove the bordeaux outline that indicates the storage of a link
            saveBtn.style.display = 'inline-block'; // Display the save button again
            editBtn.style.display = 'none';         // Hide the edit button 
        });
    }

    // Save link button 
    if (saveBtn && linkInput) {
        // When the user presses the save link button 
        saveBtn.addEventListener('click', () => {
            const link = linkInput.value.trim();    // Get the link value, without any gaps
            const thesisId = thesis.thesis_id;   // Get the thesis id

            // Validate the correct link
            if (!link || !link.startsWith('http')) {
                showCustomAlert('Παρακαλώ εισάγετε έναν έγκυρο σύνδεσμο.');
                return;
            }

            // Store the link in the db
            fetch('/save-nimertis-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thesis_id: thesisId, nimertis_link: link })
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    showCustomAlert('Ο σύνδεσμος αποθηκεύτηκε με επιτυχία.');

                    linkInput.setAttribute('readonly', true);   // Make it readonly after the submit
                    linkInput.classList.add('bordeaux-outline');// Add colour styling to the input, so that the outline after the submit is bordeaux
                    saveBtn.style.display = 'none';             // Hide the display button 

                    // Show the edit button, so the user can change the link
                    if (editBtn) {  // If for secure reason the edit button is not found
                        editBtn.style.display = 'inline-block';
                    }
                } else {
                    showCustomAlert('Σφάλμα αποθήκευσης: ' + result.error);
                }
            })
            .catch(() => {
                showCustomAlert('Σφάλμα δικτύου.');
            });
        });
    }
}

// --------------------------------------------------------------------------------------- //
// Περατωμένη //
function completedThesisContent(thesis) {
    cardDisplay(); // Call the function that handles the card display
    fillCompletedInfo(thesis); // Call the function that fills the completed info section
    renderTimeline(thesis); // Call the function that renders the timeline
}

// Function that handles the card display for completed thesis
function cardDisplay() {
    // Get the divs in order to place the practical under the chronologic info
    const gradesCard = document.getElementById('gradesCard');
    const chronoCard = document.getElementById('chronologicalInfo');

    if (gradesCard && chronoCard) {
        // Create a spacer div, so that the grades info is not too close to the chronological info
        const spacer = document.createElement('div');
        spacer.style.height = '2rem'; // Add the same spacing as the other sections
        // Needed 2 because the above card div does not have a margin-bottom

        chronoCard.insertAdjacentElement('afterend', spacer);    // Insert the spacer after the chronological info section
        spacer.insertAdjacentElement('afterend', gradesCard);    // Insert the grades info after the spacer
        gradesCard.style.display = 'block';
    }

    // If the thesis is completed, show the completed info section
    // Find all the elements with the class card-body inside the thesisManagement div and hide them
    // Keep only the needed ones, the gap now hides 
    document.querySelectorAll('#thesisManagement .card-body').forEach(body => {
        if (
            !body.contains(document.getElementById('completedInfo')) &&
            !body.contains(document.getElementById('chronologicalInfo')) && 
            !body.contains(document.getElementById('gradesInfo'))
        ) {
            body.style.display = 'none';
        }
    });
}

// Function to fill the completed info section
function fillCompletedInfo(thesis) {
    // Show the completed info section
    const completedDiv = document.getElementById('completedInfo');
    completedDiv.style.display = 'block';

    // Display the completed thesis information
    const completedContent = document.getElementById('completedContent');
    completedContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center" style="min-height: 60px; pointer-events: none;">
            <p><strong class="text-bordeaux">Θέμα:</strong><br> ${thesis.title}</p>
            <span class="btn bordeaux-outline btn-sm my-auto rounded-pill">${thesis.state}</span>
        </div>
        <p><strong class="text-bordeaux">Περιγραφή:</strong><br> ${thesis.description}</p>
        <div class="mt-3">
        <hr>
        <p>Η διπλωματική εργασία, καθώς και η διαδικασία υποβολής, έχει ολοκληρωθεί. Για να δείτε περισσότερες λεπτομέρειες σχετικά με την διπλωματική σας, παρακαλώ επιλέξτε το παρακάτω κουμπί.</p>
        <div class="text-center mb-2">
            <button class="btn btn-outline-bordeaux mt-3" id="moreInfoButton">
                Για περισσότερες λεπτομέρειες πατήστε εδώ
            </button>
        </div>
    `;

    // Add an event listener to the button to show more info
    document.getElementById('moreInfoButton').addEventListener('click', function () {
        window.fromCompletedInfo = true;    // Set the flag to true, so the back button will work correctly
        document.getElementById('viewMyThesis').click();    // Go to the view thesis section
    });
}

// Function used to add the timeline events
async function renderTimeline(thesis) {
    // Show the chronological info section
    const timelineContainer = document.getElementById('chronologicalInfo');
    timelineContainer.style.display = 'block'; // Show the timeline section

    // Clear the old container, so that the data is shown only once, no duplicates
    timelineContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2 mb-2">
            <i class="fa-solid fa-clock text-bordeaux me-2 fs-4"></i>
            <h5 class="mb-0 align-middle" style="line-height: 1.2;">Χρονολόγιο</h5>
        </div>
    `;

    const timelineList = document.createElement('ul');  // Create a new list for the timeline
    timelineList.className = 'list-unstyled ms-3';      // Hide the bullets and add some left margin
    timelineContainer.appendChild(timelineList);        // Append the list to the timeline container

    const data = await getEventsData(thesis); // Call the function to get the events data and populate the timeline
    showEvents(data, timelineList); // Call the function to show the events in the timeline

    // Show the protocol info section
    // This section is similar to the one used in Υπό Εξέταση, there are small changes made (buttons etc)
    const gradesData = await fetchGrades(thesis); // Call the function to get the grades data and populate the grades section

    // The followings are used to show the nimertis link if it is already submitted
    // and to allow the user to submit it if it is not submitted yet
    showAndSubmitLink(gradesData, thesis); // Call the function to show the nimertis link section

}

// Function to fetch the events data from the server
async function getEventsData(thesis) {
    const thesisId = thesis.thesis_id; // Get the thesis ID from the thesis object
    try {
        const res = await fetch(`/get-thesis-events/${thesisId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch {
        showCustomAlert('Σφάλμα κατά τη φόρτωση των γεγονότων.');
        return { events: [] };
    }
}

// Function to display the events in the timeline
function showEvents(data, timelineList) {
    // If the fetch was successful and data was returned
    if (data.events && data.events.length > 0) {
        const events = data.events;

        // Create the timeline HTML structure
        let timelineHTML = '<div class="timeline-arrows">';
        
        for (let i = 0; i < events.length - 1; i++) {
            const currentStageNumber = i + 1; // Stage number for the old state
            const nextStageNumber = currentStageNumber + 1;    // Stage number for the next state

            const progressPercent = ((currentStageNumber / 5) * 100); // Calculate the progress percentage for the old state
            const nextProgressPercent = ((nextStageNumber / 5) * 100); // Calculate the progress percentage for the next state

            const currentStage = events[i];     // Current stage object
            const nextStage = events[i + 1];    // Next stage object

            const currentTicks = i + 2; // The ticks that indicate the number of stages completed

            // The HTML consists of three columns, one and three are for the states and the second shows the arrow and the date that the change happened
            timelineHTML += `
                <div class="timeline-step d-flex align-items-start mb-4">
                    <div class="status me-4" style="text-align: center; width: 260px;">
                        <div style="font-weight: 500;">${currentStage.status}</div>
                        <div class="progress mt-1" style="height: 20px; width: 260px; font-size: 0.8rem;">
                            <div class="progress-bar bg-bordeaux d-flex justify-content-center align-items-center" role="progressbar" style="width: ${progressPercent}%; white-space: nowrap;">
                                Στάδιο ${currentStageNumber}
                            </div>
                        </div>
                    </div>
                    <div class="arrow-container d-flex flex-column align-items-center me-4">
                    <span class="date">${new Date(nextStage.event_date).toLocaleDateString('el-GR')}</span>
                    <div class="custom-arrow"></div>
                    </div>
                    <div class="status me-4" style="text-align: center; width: 260px;">
                        <div style="font-weight: 500;">${nextStage.status}</div>
                        <!-- Give bigger width now, so that the ticks can be displayed without overlapping the bar -->
                        <div class="progress-ticks mt-1" style="width: 360px;">
                            <div class="progress mt-1" style="height: 20px; width: 260px; font-size: 0.8rem;">
                                <div class="progress-bar bg-bordeaux d-flex justify-content-center align-items-center" role="progressbar" style="width: ${nextProgressPercent}%; white-space: nowrap;">
                                    Στάδιο ${nextStageNumber}
                                </div>
                            </div>
                            <div class="ticks">
                                ${'<i class="fa-solid fa-check text-bordeaux"></i>'.repeat(currentTicks)}
                            </div> 
                        </div>
                    </div>
                </div>
            `;
        }

        timelineHTML += '</div>';               // Close the wrapper
        timelineList.innerHTML = timelineHTML;  // Set the inner HTML of the timeline list to the one created above
    } else {
        timelineList.innerHTML = '<p>Δεν έχουν καταγραφεί γεγονότα</p>';
    }
}

// Function to show the nimertis link or let user submit it 
function showAndSubmitLink(gradesData, thesis) {
    const grades = gradesData.grades;
    // The followings are used to show the nimertis link if it is already submitted
    // and to allow the user to submit it if it is not submitted yet
    const existingNimertis = thesis.nimertis_link || '';
    const isReadonly = existingNimertis ? 'readonly' : '';
    const hideSaveBtn = existingNimertis ? 'style="display: none;"' : '';
    const outlineClass = existingNimertis ? 'bordeaux-outline' : '';
    if (Array.isArray(grades) && grades.length > 0) {
        // Create a container for the protocol content
        // if the 3 grades have been submitted
        gradesInfo.innerHTML = `
            <!-- Space added -->
            <div class="my-3"></div>
            <p>Το πρακτικό της εξέτασης έχει ολοκληρωθεί και μπορείτε να δείτε συνοπτικά τις αξιολογήσεις σας παρακάτω:</p>
            <ul>
            ${grades.map(grade => {
                const isInstructor = thesis && grade.professor_full_name === thesis.full_instructor_name;
                const roleText = isInstructor ? ' (Επιβλέπων)' : '';
                return `<li><strong>${grade.professor_full_name}${roleText}:</strong> ${grade.grade}</li>`;
            }).join('')}
            </ul>
            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Αναλυτικά το αρχείο πρακτικού εξέτασης είναι διαθέσιμο:</p>
                </div>
                <button class="btn btn-outline-bordeaux w-100 ms-2" id="downloadProtocolBtn">
                    Εμφάνιση Πρακτικού σε μορφή HTML
                </button>
            </div>

            <!-- On click event for the download button, so the function is called -->
            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Μπορείτε να εξάγετε το αρχείο και σε μορφή PDF:</p>
                </div>
                <button class="btn btn-outline-bordeaux w-100 ms-2" id="downloadProtocolPdfBtn">
                    Κατέβασε το Πρακτικό σε PDF
                </button>
            </div>

            <div class="d-flex align-items-center mb-2" style="max-width: 750px;">
                <div style="min-width: 420px;">
                    <p class="mb-0">Καταχωρημένος σύνδεσμος για το αποθετήριο Νημερτής:</p>
                </div>
                <input type="text" id="nimertisLink" class="form-control ms-2 me-2 ${outlineClass}" placeholder="https://nimertis.example.com" value="${existingNimertis}" ${isReadonly} />
            </div>
        `;

        // The following functions are the same ones used in Υπό Εξέταση state 
        // Add the event listener for the download button
        addDownloadListener(thesis);
        // Add the event listener for the download PDF button
        addDownloadPdfListener(thesis);
    }
}

// --------------------------------------------------------------------------------------- //
// Υπό Ανάθεση //

// Function to handle the thesis under assignment
async function underAssignmentThesisContent(thesis) {
    // If the thesis is under assignment, show the members section
    // Find all the elements with the class card-body inside the thesisManagement div and hide them
    // Keep only the needed ones, the gap now hides
    document.querySelectorAll('#thesisManagement .card-body').forEach(body => {
        if (!body.contains(document.getElementById('membersContainer'))) {
            body.style.display = 'none';
        }
    });

    // Show the members header
    const committee = document.getElementById('membersContainer');
    committee.style.display = 'block';
    // Show the members content
    const membersContent = document.getElementById('membersContent');
    membersContent.innerHTML = '';

    membersContent.innerHTML = showMembersSection(thesis); // Call the function to show the members section

    const dropdownWrapper = await getProfessorsList(thesis); // Call the function to get the professors list and populate the dropdown
    membersContent.appendChild(dropdownWrapper);    // Add the dropdown to the members content

    await existingInvitations(thesis, dropdownWrapper); // Call the function to fetch and display existing invitations
    addNewProfessorListener(thesis, dropdownWrapper); // Add event listener to the Add Professor button
}

// Function to show the members section
function showMembersSection(thesis) {
    return `
        <p class="mb-0">Ο επιβλέπων καθηγητής της διπλωματικής σας είναι ο/η: ${thesis.full_instructor_name}</p>
        <div class="my-2"></div>
        <p class="mb-0 text-bordeaux">Οδηγίες σχετικά με την διαδικασία επιλογής τριμελούς επιτροπής:</p>
        <p class="mb-0">
            Από την παρακάτω λίστα καθηγητών μπορείτε να επιλέξετε εκείνους που θα θέλατε να γίνουν μέλη στην τριμελή επιτροπή για τη διπλωματική σας. 
            Μπορείτε να επιλέξετε περισσότερους από δύο καθηγητές, μόλις δύο αποδεχτούν το αίτημά σας, θα ορισθούν αυτόματα ως μέλη της τριμελούς επιτροπής.
        </p>
    `;
}

// Function to get the professors list and populate the dropdown
async function getProfessorsList(thesis) {
    const professors = await fetchProfessors(); // Call the function to fetch the professors list

    // Filter out the instructor from the list of professors
    const filtered = professors.filter(p => p.full_name !== thesis.full_instructor_name);

    // Create the dropdown for selecting professors
    const dropdownWrapper = document.createElement('div');
    dropdownWrapper.className = 'mt-3';

    dropdownWrapper.innerHTML = `
        <label for="professorDropdown" class="form-label">
            Επιλογή μέλους τριμελούς:
        </label>
        <div class="d-flex align-items-center gap-2">
            <select id="professorDropdown" class="form-select w-25">
                <option disabled selected>Επιλέξτε καθηγητή</option>
                ${filtered.map(p => `<option value="${p.professor_id}">${p.full_name}</option>`).join('')}
            </select>
            <button id="addProfessorButton" class="btn btn-outline-bordeaux">
                Επιλογή
            </button>
        </div>
        <div id="invitationsList" class="mt-3"></div>
    `;

    return dropdownWrapper;
}

// Function to fetch the professors list from the server
async function fetchProfessors() {
    try {
        const res = await fetch('/all-professors');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch {
        showCustomAlert('Σφάλμα κατά τη φόρτωση της λίστας καθηγητών.');
        return { professors: [] };
    }
}

// Function to display existing invitations
async function existingInvitations(thesis, dropdownWrapper) {
    // Get references to the dropdown and invitations list
    const professorDropdown = dropdownWrapper.querySelector('#professorDropdown');
    const invitationsList = dropdownWrapper.querySelector('#invitationsList');

    console.log('Fetching invitations for thesis:', thesis.thesis_id);
    const data = await fetchAndDisplayInvitations(thesis); // Fetch existing invitations
    console.log('Invitations data received:', data);

    // If there are existing invitations, display them
    if (data.success && data.invitations.length > 0) {
        console.log('Found', data.invitations.length, 'existing invitations');
        // Get the proseffors id in order to disable the ones that already have an invitation from the dropdown 
        const invitedIds = data.invitations.map(inv => inv.professor_id);

        // Create a dictionary for the status labels, to display them in greek 
        const statusLabels = {
            pending: "Σε κατάσταση αναμονής",
            accepted: "Έγινε αποδοχή",
            declined: "Απορρίφθηκε"
        };

        // Show the invitations in the list
        invitationsList.innerHTML = data.invitations
        .map(inv => `<p class="text-success mb-0">Έχετε στείλει αίτημα στον/στην ${inv.full_name}</p>`
            + `<p class="text-muted mb-0">Ημερομηνία αποστολής αιτήματος: ${new Date(inv.invitation_date).toLocaleDateString('el-GR')}</p>`
            + `<p class="text-muted mb-3">Κατάσταση: ${statusLabels[inv.status]}</p>`
        )
        .join('');

        // Disable the professors that have already been selected
        invitedIds.forEach(id => {
            const option = professorDropdown.querySelector(`option[value="${id}"]`);
            if (option) {
                option.disabled = true;
                option.textContent += ' (Έχει ήδη αποσταλεί)';
            }
        });
    } else {
        console.log('No existing invitations found or request failed');
    }
}
// Function used to fetch the committe invitations
async function fetchAndDisplayInvitations(thesis) {
    try {
        const res = await fetch(`/get-committee-invitations/${thesis.thesis_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching invitations:', error);
        showCustomAlert('Σφάλμα κατά τη φόρτωση των προσκλήσεων.');
        return { success: false, invitations: [] };
    }
}

// Function to add event listener to the Add Professor button
function addNewProfessorListener(thesis, dropdownWrapper) {
    // Get references to the dropdown, button and invitations list
    const addProfessorBtn = dropdownWrapper.querySelector('#addProfessorButton');

    // Send a new request
    addProfessorBtn.addEventListener('click', async () => {
        // Get the selected professor from the dropdown
        const selectedOption = professorDropdown.options[professorDropdown.selectedIndex];
        // If no option is selected or the selected option is disabled, show an alert
        if (!selectedOption || selectedOption.disabled) {
            showCustomAlert('Παρακαλώ επιλέξτε καθηγητή');
            return;
        }

        // Get the professor id and name, and the thesis id
        const professorId = selectedOption.value;
        const professorName = selectedOption.textContent;
        const thesisId = thesis.thesis_id;

        // Validate the thesis id
        if (!thesisId) {
            showCustomAlert('Σφάλμα: Δεν βρέθηκε η διπλωματική.');
            return;
        }

        // Post request to send the invitation, save it in the db
        const result = await fetchCommitteInvitation(thesisId, professorId);
        // If the request was successful, show a success message and update the invitations list
        // the invitations list that is shown to the user
        if (result.success) {
            const inv = result.invitation;  // Get the invitation data from the result

            // Create a dictionary for the status labels, to display them in greek 
            const statusLabels = {
                pending: "Σε κατάσταση αναμονής",
                accepted: "Έγινε αποδοχή",
                declined: "Απορρίφθηκε"
            };

            // Show the new invitation in the list
            invitationsList.innerHTML += `
                <div class="mb-3">
                    <p class="text-success mb-0">Έχετε στείλει αίτημα στον/στην ${inv.full_name}</p>
                    <p class="text-muted mb-0">Ημερομηνία αποστολής αιτήματος: ${new Date(inv.invitation_date).toLocaleDateString('el-GR')}</p>
                    <p class="text-muted mb-3">Κατάσταση: ${statusLabels[inv.status]}</p>
                </div>
            `;

            // Disable the chosen dropdown option
            const option = professorDropdown.querySelector(`option[value="${inv.professor_id}"]`);

            if (option) {
                option.disabled = true;
                option.textContent += ' (Αίτημα Στάλθηκε)';
            }
        } else {
            showCustomAlert(`Σφάλμα: ${result.error}`);
        }
    });
}

// Function to send the committe invitation to the server
async function fetchCommitteInvitation(thesisId, professorId) {
    try {
        const res = await fetch('/send-committee-invitation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ thesis_id: thesisId, professor_id: professorId })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch {
        showCustomAlert('Σφάλμα δικτύου κατά την αποστολή του αιτήματος.');
        return { success: false };
    }
}

// --------------------------------------------------------------------------------------- //
// Ενεργή //
function activeThesisContent(thesis){
    // If the thesis is under assignment, show only the info to the student
    // Find all the elements with the class card-body inside the thesisManagement div and hide them
    // Keep only the needed ones, the gap now hides
    document.querySelectorAll('#thesisManagement .card-body').forEach(body => {
        if (!body.contains(document.getElementById('activeContainer'))) {
            body.style.display = 'none';
        }
    });

    // Show the members header
    const active = document.getElementById('activeContainer');
    active.style.display = 'block';
    // Show the members content
    const membersContent = document.getElementById('activeContent');
    membersContent.innerHTML = '';
    // The committee members' content
    membersContent.innerHTML = renderActiveThesisContent(thesis);
    
    // Add an event listener to the button to show more info
    addActiveThesisListener();
}

// Function to render the active thesis content
function renderActiveThesisContent(thesis) {
    // Create the HTML content
    return `
        <p class="mb-0">Η επίσημη ανάθεση του θέματος έχει ολοκληρωθεί.</p>
        <p class="mb-0 mt-2" style="text-decoration: underline;">Ακολουθούν ορισμένες οδηγίες:</p>
        <p class="mb-0 mt-2">Η διπλωματική σας βρίσκεται στην κατάσταση "Ενεργή", αυτό σημαίνει ότι οι καθηγητές που επιλέξατε έχουν αποδεχτεί το αίτημά σας και 
            η τριμελής επιτροπή έχει οριστεί. Αναμένετε από τον επιβλέποντα καθηγητή σας, κυρία/ος <span class="text-bordeaux">${thesis.full_instructor_name}</span>, να σας καθοδηγήσει στη συνέχεια της διαδικασίας.
            Αναμένετε ο επιβλέπων καθηγητής να ορίσει την κατάσταση της διπλωματικής σας σε "Υπό Εξέταση", οπότε και θα μπορείτε να προχωρήσετε στην ανάρτηση της, αλλά και στη συμπλήρωση ορισμένων διαδικαστικών, όπως είναι ο σύνδεσμος για το αποθετήριο Νημερτής.
            Έως ότου η διαδικάσια προχωρήσει από τον επιβλέποντα καθηγητή σας, μπορείτε να δείτε τις λεπτομέρειες της διπλωματικής σας επιλέγοντας παρακάτω:</p>
        <button class="btn btn-outline-bordeaux mt-3" id="activeThesis">
            Προβολή Διπλωματικής Εργασίας
        </button>
    `;
}

// Function to add the event listener to the active thesis button
function addActiveThesisListener() {
    document.getElementById('activeThesis').addEventListener('click', function () {
        window.fromCompletedInfo = true;    // Set the flag to true, so the back button will work correctly
        document.getElementById('viewMyThesis').click();    // Go to the view thesis section
    });
}

// --------------------------------------------------------------------------------------- //
// Helper functions

// Ensure the modal is closed when the user clicks outside of it
function initializeModalScope() {
    const modalElement = document.getElementById('deleteThesisModal');

    if (modalElement) {
        modalElement.addEventListener('hide.bs.modal', function () {
        // Ensure that the modal is closed properly, when the user clicks x or outside the modal
        if (modalElement.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        });
    }
}

// Function to show an alert message
function showCustomAlert(message, callback) {
    const modal = document.getElementById('customAlert');               // Reference to the custom alert modal backdrop
    const messageBox = document.getElementById('customAlertMessage');   // Reference to the message box inside the modal
    const okBtn = document.getElementById('customAlertOk');             // Reference to the OK button inside the modal

    messageBox.textContent = message;       // Set the message text
    modal.style.display = 'flex';           // Show the modal by changing its display to flex

    // Hide the modal when OK is clicked
    okBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (typeof callback === 'function') callback(); // Call the callback function if provided
    });
}

// Function to hide all sections when the sidebar is toggled
function hideAllSections() {
    const allSections = [
        document.getElementById('editProfile'),
        document.getElementById('thesisList'),
        document.getElementById('dashboardTitle'),
        document.getElementById('thesisManagement')
    ];

    allSections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

// This is the function for the file rendering
function renderUploadedFile(filename) {
    const fileInput = document.getElementById('progressFile');  // Find the file element in the form in order to handle it

    // Remove previous display, to avoid duplicates, for the button and the text that informs the student about the uploaded file
    const oldInfo = document.querySelector('#progressFileInfo');
    if (oldInfo) oldInfo.remove();
    const oldBtn = document.querySelector('#changeFileButton');
    if (oldBtn) oldBtn.remove();

    // Next line ensures that the note to enter file will not appear now
    fileInput.removeAttribute('required');              // Remove the required attribute since a file has already been uploaded
    fileInput.required = false;                         // Ensure the file input is not required if a file has been uploaded
    fileInput.parentElement.style.display = 'none';     // Hide the file input field since a file has already been uploaded 
        
    const realName = filename.split('-').slice(1).join('-');   // Remove the prefix that is added during storing the file
    // Handles the text that will inform the student for the current uploaded file           
    const info = document.createElement('p');
    info.id = 'progressFileInfo';
    info.className = 'text-muted mt-2';
    info.innerHTML = `Έχετε ήδη ανεβάσει το αρχείο: <strong>${realName}</strong>`;

    // Create the button that lets the student upload a new file
    const changeBtn = document.createElement('button');
    changeBtn.type = 'button';
    changeBtn.id = 'changeFileButton';
    changeBtn.className = 'btn btn-sm btn-outline-bordeaux mt-2'; // Add a class for styling
    changeBtn.textContent = 'Αλλαγή Ανεβασμένου Αρχείου';

    // Handles the file upload when the student clicks to change the file
    changeBtn.onclick = () => {
        fileInput.parentElement.style.display = 'block';            // Reveal the file input field
        fileInput.required = true;                                  // Make field required again
        info.remove();                                              // Remove the info message
        changeBtn.remove();                                         // Remove the change button
    };

    // Add the info and change button to the file input's parent element
    fileInput.parentElement.parentElement.prepend(info, changeBtn);
}

// Function to render the submitted links
function renderSubmittedLinks(linksArray, thesis) {
    // Finds the container where the links will be displayed
    const container = document.getElementById('dynamicLinksArea');
    container.innerHTML = ''; // Clear the container to remove old links

    // Create a title for the links section and some styling
    const title = document.createElement('p');
    title.className = 'text-muted';
    title.textContent = 'Υποβεβλημένοι Σύνδεσμοι:';
    container.appendChild(title);

    const thesis_id = thesis.thesis_id; // Get the thesis ID for use in the delete request
    // Loop through the links and create the elements
    linksArray.forEach(link => {
        const row = document.createElement('div');            // Create the row, where the link and the delete will be placed
        row.className = 'link-row d-flex align-items-center mb-1';

        const linkElement = document.createElement('a');      // a: clickable hyperlink element
        linkElement.href = link;
        linkElement.target = '_blank';                        // If pressed it will open in a new tab
        linkElement.className = 'd-block mb-1 text-bordeaux'; // Add a class for styling
        linkElement.innerHTML = `<i class="fas fa-link me-2"></i>${link}`;

        const removeBtn = document.createElement('span');     // Create the remove button element
        removeBtn.innerHTML = '&times;';
        removeBtn.className = 'remove-btn ms-2';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = async () => {
            // Send a request to your backend to remove the link
            try {
                const response = await fetch('/remove-link', {
                    method: 'POST', // or 'DELETE' if your backend supports it
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link, thesis_id }) 
                });
                const result = await response.json();
                if (result.success) {
                    row.remove();   // Remove the row from the DOM
                    // Check if there are any more link rows
                    const container = document.getElementById('dynamicLinksArea');
                    const remainingLinks = container.querySelectorAll('.link-row');
                    // If there are no links left hide the title "Υποβεβλημένοι Σύνδεσμοι"
                    if (remainingLinks.length === 0) {
                        // Hide the title or the whole section
                        const title = container.querySelector('p.text-muted');
                        if (title) title.style.display = 'none';
                        // Or hide the whole container:
                        // container.style.display = 'none';
                    }
                } else {
                    alert('Αποτυχία διαγραφής συνδέσμου από τη βάση.');
                }
            } catch (err) {
                alert('Σφάλμα δικτύου κατά τη διαγραφή.');
            }
        };

        row.appendChild(linkElement);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

// This is created for the additional links
function addLinkInput() {
    // The container where the new link input will be added
    const container = document.getElementById('dynamicLinksArea');

    // The new div where each new link will be added
    const card = document.createElement('div');
    card.className = 'link-card w-50';                      // Add a class for styling, from the css file

    const icon = document.createElement('i');               // Create the icon object
    icon.className = 'fas fa-link text-bordeaux me-2';      // Add the icon class and color

    const input = document.createElement('input');          // Create the input element
    input.type = 'url';
    input.name = 'progressLinks[]';                         // All the inputs will be send as an array       
    input.placeholder = 'https://upatras.com';              // Placeholder text

    const removeBtn = document.createElement('span');       // Create the remove button
    removeBtn.innerHTML = '&times;';                        // This creates the x symbol
    removeBtn.className = 'remove-btn';                     // Add a class for styling
    removeBtn.onclick = () => card.remove();                // Remove the card when clicked

    // Add the created elements to the card
    card.appendChild(icon);
    card.appendChild(input);
    card.appendChild(removeBtn);

    // Add the card to the container
    container.appendChild(card);
}

// Function for the successful submission of the thesis
function lockExaminationFields() {
    const fields = ['dateOfExamination', 'timeOfExamination', 'examinationType']; // Array with the forms 'fields
    // Loop through the fields and disable them, also add styling
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('disabled', true);
            input.classList.add('bordeaux-outline');
        }
    });

    // Do the same for the dynamically shown field of link or room
    const type = document.getElementById('examinationType').value;
    const extraId = type === 'Διά Ζώσης' ? 'examinationRoom' : 'examinationLink';
    const extraInput = document.getElementById(extraId);
    if (extraInput) {
        extraInput.setAttribute('disabled', true);
        extraInput.classList.add('bordeaux-outline');
    }

    document.querySelector('#timeOfExaminationForm button[type="submit"]').style.display = 'none';  // Hide the submit button after submission
    document.getElementById('editExaminationButton').style.display = 'inline-block';                // Show the edit button after submission
}

// Function for permanently locking the examination fields after it is in the announcements
function lockExaminationFieldsPermanently() {
    // Call the regular lock function first
    lockExaminationFields();
    
    // Additionally hide the edit button completely for uploaded state
    const editButton = document.getElementById('editExaminationButton');
    if (editButton) {
        editButton.style.display = 'none';
    }
    
    // Maybe add a message indicating the info is finalized
    const submitButton = document.querySelector('#timeOfExaminationForm button[type="submit"]');
    if (submitButton && submitButton.parentNode) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-info mt-2';
        messageDiv.innerHTML = '<i class="fas fa-info-circle"></i> Τα στοιχεία εξέτασης έχουν οριστικοποιηθεί και δεν μπορούν να τροποποιηθούν.';
        submitButton.parentNode.appendChild(messageDiv);
    }
}

// Function to edit the examination details
function enableExaminationEdit() {
    const fields = ['dateOfExamination', 'timeOfExamination', 'examinationType']; // Array with the forms 'fields
    // Loop through the fields and disable them, also add styling
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;
            el.classList.remove('bordeaux-outline');
        }
    });

    // Do the same for the dynamically shown field of link or room
    const type = document.getElementById('examinationType').value;
    const extraId = type === 'Διά Ζώσης' ? 'examinationRoom' : 'examinationLink';
    const extra = document.getElementById(extraId);
    if (extra) {
        extra.disabled = false;
        extra.classList.remove('bordeaux-outline');
    }

    document.querySelector('#timeOfExaminationForm button[type="submit"]').style.display = 'inline-block';  // Show the submit button when editing
    document.getElementById('editExaminationButton').style.display = 'none';                                // Hide the edit button when editing
}

// Function to download the PDF of the protocol
// We are using puppeteer to generate the PDF on the server side
function downloadPDF(thesis) {
    const thesisId = thesis.thesis_id;   // Get the thesis ID from the parameter
    // Validate the thesis ID
    if (!thesisId) {
        showCustomAlert('Δεν εντοπίστηκε διπλωματική εργασία.');
        return;
    }
    // Redirect to the download route
    window.location.href = `/download-protocol/${thesisId}`;
}