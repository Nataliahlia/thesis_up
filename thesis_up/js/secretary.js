// Secretary Dashboard JavaScript 

// Set the global variables
let allTheses = []; // global variable to store all thesis topics
let filteredTheses = []; // global variable to store filtered thesis topics

document.addEventListener('DOMContentLoaded', function () {

    // Initialisation
    initializeSidebar(); 
    initializeUserInfo(); 
    initializeLogoutCustom(); 
    initializeSectionPersistence(); 
    initializeModalScope();    
    initializeAddUser();
    initializeTheses();

    // The helpers
    window.showCustomAlert = showCustomAlert;

    // Restore active section on reload
    const activeSection = sessionStorage.getItem('secretaryActiveSection'); // Get the saved section from the session storage
    if (activeSection && document.getElementById(activeSection)) {
        document.getElementById(activeSection).click();   // Simulate a click on the saved section to show it
    } else {
        document.getElementById('viewTheses').click();  // If no section is saved, show the default section -> handles starting page as well 
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

// Save active section on menu click
function initializeSectionPersistence() {
    ['viewTheses', 'addUser'].forEach(id => {
        const btn = document.getElementById(id);    // Get the button by its id
        if (btn) {
            btn.addEventListener('click', () => {
                sessionStorage.setItem('secretaryActiveSection', id);   // Save the id of the button in the session storage
            });
        }
    });
}

// --------------------------------------------------------------------------------------- //
// User Management Functions
function initializeAddUser() {
    // Show the form when the button is clicked and later handle the form submission using AJAX
    const button = document.getElementById("addUser");
    const sidebar = document.getElementById("sidebar");
    const form = document.getElementById("addUserForm");
    const title = document.getElementById("dashboardTitle");
    
    if (button) {
        button.addEventListener('click', function(e) {
            console.log("Button clicked");
            e.preventDefault(); // Prevent page reload
            hideAllSections(); // Hide all sections before showing the form
            form.style.display = "block"; // Show the form
            title.style.display = "none"; // Hide the heading
            sidebar.style.left = "-250px"; // Move sidebar out of view
            document.querySelector('.main-content').style.marginLeft = "0"; // Reset main content position, removes the margin that was applied when sidebar was visible
        });
    }
    const uploadForm = document.getElementById('uploadForm');   // Get the form element
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await uploadUsers();
        });
    }
}

async function uploadUsers() {
    // Finds the file input that the user selected
    const fileInput = document.getElementById('jsonFile');
    // Finds the div where the result will be displayed
    const uploadResult = document.getElementById('uploadResult');
    const list = document.getElementById('userList');
    const userSection = document.getElementById('userSection');

    // Check if everything is included 
    if (!fileInput || !uploadResult || !list || !userSection) return;

    // Check if the user has selected a file
    if (!fileInput.files.length) {
        showCustomAlert('Παρακαλώ επιλέξτε αρχείο.');
        return;
    }

    // Create the object that is used in order to sent the data to the server
    const formData = new FormData();
    // Adds the file that the user selected in the FormData object
    formData.append('userAddingFile', fileInput.files[0]);

    try {
        uploadResult.innerHTML = '';         // Clear previous messages
        list.innerHTML = '';                 // Clear previous users
        userSection.style.display = 'none';  // Hide the user section initially

        // Send the AJAX request to the server
        const response = await fetch('/upload-user', { method: 'POST', body: formData });
        // Wait for the response from the server
        const result = await response.json();

        if (response.ok) {
            // Υπολογισμός συνολικών χρηστών που προστέθηκαν και παραλείφθηκαν
            const totalAdded = result.addedStudents + result.addedProfessors;
            const totalSkipped = (result.duplicateStudents?.length || 0) + (result.duplicateProfessors?.length || 0);
            
            // Καθορισμός του τύπου μηνύματος ανάλογα με τα αποτελέσματα
            let alertClass = 'alert-success';
            let message = '';
            
            if (totalAdded === 0 && totalSkipped > 0) {
                alertClass = 'alert-warning';
                message = `Δεν προστέθηκε κανένας χρήστης. Όλοι οι ${totalSkipped} χρήστες υπήρχαν ήδη στη βάση δεδομένων.`;
            } else if (totalAdded > 0 && totalSkipped > 0) {
                alertClass = 'alert-info';
                message = `Προστέθηκαν ${result.addedStudents} φοιτητές και ${result.addedProfessors} καθηγητές. ${totalSkipped} χρήστες παραλείφθηκαν λόγω διπλότυπων εγγραφών.`;
            } else if (totalAdded > 0 && totalSkipped === 0) {
                alertClass = 'alert-success';
                message = `Προστέθηκαν επιτυχώς ${result.addedStudents} φοιτητές και ${result.addedProfessors} καθηγητές.`;
            } else {
                alertClass = 'alert-danger';
                message = 'Δεν ήταν δυνατή η επεξεργασία των χρηστών.';
            }
            
            uploadResult.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
            fileInput.value = '';

            // Εμφάνιση χρηστών που προστέθηκαν επιτυχώς
            if ((result.students && result.students.length > 0) || (result.professors && result.professors.length > 0)) {
                console.log('Displaying successfully added users');
                
                // Προσθήκη επικεφαλίδας για τους επιτυχώς προστιθέμενους χρήστες
                if (totalAdded > 0) {
                    const successHeader = document.createElement('li');
                    successHeader.className = 'list-group-item list-group-item-success fw-bold';
                    successHeader.innerHTML = `<i class="fas fa-check-circle me-2"></i>Χρήστες που προστέθηκαν επιτυχώς (${totalAdded}):`;
                    list.appendChild(successHeader);
                }
                
                // Εμφάνιση φοιτητών που προστέθηκαν
                if (result.students && result.students.length > 0) {
                    result.students.forEach(student => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-success';
                        li.innerHTML = `<strong>Φοιτητής/τρια:</strong> ${student.name} ${student.surname} | <strong>ΑΜ:</strong> ${student.student_number} | <strong>Email:</strong> ${student.email}`;
                        list.appendChild(li);
                    });
                }
                
                // Εμφάνιση καθηγητών που προστέθηκαν
                if (result.professors && result.professors.length > 0) {
                    result.professors.forEach(professor => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-success';
                        li.innerHTML = `<strong>Καθηγητής/τρια:</strong> ${professor.name} ${professor.surname} | <strong>Email:</strong> ${professor.email} | <strong>Τμήμα:</strong> ${professor.department || 'Δ/Υ'}`;
                        list.appendChild(li);
                    });
                }
            }
            
            // Εμφάνιση χρηστών που παραλείφθηκαν λόγω διπλότυπων
            if ((result.duplicateStudents && result.duplicateStudents.length > 0) || (result.duplicateProfessors && result.duplicateProfessors.length > 0)) {
                console.log('Displaying skipped users due to duplicates');
                
                // Προσθήκη επικεφαλίδας για τους παραλειφθέντες χρήστες
                if (totalSkipped > 0) {
                    const duplicateHeader = document.createElement('li');
                    duplicateHeader.className = 'list-group-item list-group-item-warning fw-bold';
                    duplicateHeader.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Χρήστες που παραλείφθηκαν (διπλότυπες εγγραφές) (${totalSkipped}):`;
                    list.appendChild(duplicateHeader);
                }
                
                // Εμφάνιση φοιτητών που παραλείφθηκαν
                if (result.duplicateStudents && result.duplicateStudents.length > 0) {
                    result.duplicateStudents.forEach(student => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-warning';
                        li.innerHTML = `<strong>Φοιτητής/τρια:</strong> ${student.name} ${student.surname} | <strong>ΑΜ:</strong> ${student.student_number} | <strong>Email:</strong> ${student.email} <em>(Υπάρχει ήδη)</em>`;
                        list.appendChild(li);
                    });
                }
                
                // Εμφάνιση καθηγητών που παραλείφθηκαν
                if (result.duplicateProfessors && result.duplicateProfessors.length > 0) {
                    result.duplicateProfessors.forEach(professor => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-warning';
                        li.innerHTML = `<strong>Καθηγητής/τρια:</strong> ${professor.name} ${professor.surname} | <strong>Email:</strong> ${professor.email} <em>(Υπάρχει ήδη)</em>`;
                        list.appendChild(li);
                    });
                }
            }
            
            // Εμφάνιση της ενότητας με τα αποτελέσματα
            if (totalAdded > 0 || totalSkipped > 0) {
                userSection.style.display = 'block';
            }
        } else {
            uploadResult.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        }
    } catch (err) {
        showCustomAlert('Σφάλμα σύνδεσης.');
    }
}

// --------------------------------------------------------------------------------------- //
// Theses Functionality Functions
function initializeTheses() {
    const Theseslist = document.getElementById("thesisList");
    const button = document.getElementById("viewTheses");
    const sidebar = document.getElementById("sidebar");
    const title = document.getElementById("dashboardTitle");

    if (button) {
        button.addEventListener('click', async function (e) {
            e.preventDefault(); // Prevent page reload
            hideAllSections(); // Hide all sections before showing the form
            Theseslist.style.display = "block"; // Show the form
            title.style.display = "none"; // Hide the heading
            sidebar.style.left = "-250px"; // Move sidebar out of view
            document.querySelector('.main-content').style.marginLeft = "0"; // Reset main content position, removes the margin that was applied when sidebar was visible
          //  showSection('thesisList', 'Διπλωματικές Εργασίες');
            await loadTheses();
        });
    }
}

async function loadTheses() {
    try {
        const response = await fetch('/thesis-topics');
        if (!response.ok) {
            throw new Error();
        }
        const data = await response.json();

        // Use the data that the server - backend sent back        
        // The variables used to display the thesis topics or the filtered topics
        allTheses = data;
        filteredTheses = data;
        displayTheses(data); // Call the function that handles the display of the thesis topics
        initializeThesisFilters(); // Call the function that handles the filtering of the thesis topics
    } catch (error) {
        document.getElementById('thesisList').innerHTML = '<li class="list-group-item text-danger">Σφάλμα κατά την ανάκτηση των διπλωματικών.</li>';
        document.getElementById('thesisList').style.display = "block"; // Ensure the list is visible even on error
    }
}

// This is the function that handles the appearance of the thesis topics or the filtered topics
function displayTheses(theses) {
    // The container is the div where the cards will be displayed
    const container = document.getElementById('thesisCards'); // Get the container where the cards will be displayed
    let countDisplay = document.getElementById('thesisCount'); // Get the element where the thesis count will be displayed
    container.innerHTML = ''; // Clear previous content
    countDisplay.textContent = `Εμφάνιση: ${theses.length} από ${allTheses.length} διπλωματικές`;   // Display the count of thesis topics

    // If there are no thesis topics, display a message
    if (!theses || theses.length === 0) {
        showCustomAlert('Δεν βρέθηκαν διπλωματικές.');
        return;
    }

    // We add data in the list we created dynamically
    theses.forEach(topic => {
        // The first part of the function handles the display on the first page
        // Here we create the cards that holds some basic information of the thesis topics
        const col = document.createElement('div');      // Create a new list item
        col.className = 'col-md-12';                    // Set the class for styling

        const card = document.createElement('div');     // Create a new card
        card.className = 'card h-100  mt-2 shadow';     // Set the class for styling

        const cardBody = document.createElement('div'); // Create the card's body
        cardBody.className = 'card-body';

        const title = document.createElement('h5');     // Create the title element
        title.className = 'card-title text-bordeaux mb-3';
        title.textContent = topic.title;

        const student_name = document.createElement('p');   // Create the student name element
        student_name.className = 'card-text text-muted mb-1';
        student_name.innerHTML = `<span class="text-dark fw-bold">Φοιτητής</span>: ${topic.full_student_name}`;

        const student_id = document.createElement('p');     // Create the student ID element
        student_id.className = 'card-text text-muted';
        student_id.textContent = `AM: ${topic.student_id}`;

        // This is the button for the state -> easier for the secretary to see the state of the thesis topic
        const state = document.createElement('div');
        state.className = 'position-absolute top-0 end-0 m-3';  // Position the state button in the top right corner
        const stateSpan = document.createElement('span');       // Create a span for the state
        stateSpan.className = 'btn btn-outline-bordeaux btn-sm border border-bordeaux rounded-pill';    // Set the class for styling
        stateSpan.style.pointerEvents = 'none';     // Make it non-clickable
        stateSpan.textContent = `${topic.state}`;   // Add the state text
        state.appendChild(stateSpan);               // Add the final object

        // This is the button to see more information 
        const chooseButton = document.createElement('button');
        chooseButton.className = 'btn btn-outline-bordeaux w-100 mt-3';
        chooseButton.textContent = 'Λεπτομέρειες Διπλωματικής';

        // When the secretary chooses this button, the elements that appear are handled in the function viewThesisDetails
        chooseButton.addEventListener('click', () => viewThesisDetails(topic));

        // Assemble DOM
        cardBody.appendChild(title);
        cardBody.appendChild(student_name);
        cardBody.appendChild(student_id);
        cardBody.appendChild(chooseButton);
        card.appendChild(cardBody);
        card.appendChild(state);
        col.appendChild(card);
        container.appendChild(col);
    });
}

// This is the function that handles the appearance of the thesis topics or the filtered topics
function initializeThesisFilters() {
    const filterSelect = document.getElementById('stateFilter');    // Get the filter select element
    if (filterSelect) {
        // Handle the filter select change event
        filterSelect.addEventListener('change', function () {
            const selected = this.value;
            if (selected === 'all') {
                filteredTheses = allTheses;
            } else {
                filteredTheses = allTheses.filter(thesis => thesis.state === selected);
            }
            displayTheses(filteredTheses);
        });
    }
}

// This is the function that handles the appearance of the thesis details page
function viewThesisDetails(topic) {
    document.getElementById('thesisList').style.display = 'none';           // Hide the list of thesis
    document.getElementById('thesisDetailsPage').style.display = 'block';   // Display the thesis details page

    // Remove any existing delete button wrapper to prevent duplicates
    const detailsPage = document.getElementById('thesisDetailsPage');
    const oldWrapper = detailsPage.querySelector('.delete-button-wrapper');
    if (oldWrapper) {
        oldWrapper.remove();
    }

    // Thesis Details
    document.getElementById('thesisMainContent').innerHTML = `
        <div class="position-relative">
            <!-- Keep the state on the top right -->
            <div class="position-absolute top-0 end-0">
                <span class="btn btn-outline-bordeaux btn-sm border border-bordeaux rounded-pill mt-1 me-1" style="pointer-events: none;">
                    ${topic.state}
                </span>
            </div>
            <p><strong class="text-bordeaux">Τίτλος Διπλωματικής:</strong> <span>${topic.title}</span></p>
            <p><strong class="text-bordeaux">Περιγραφή:</strong> <span>${topic.description}</span></p>
            <p>Η επίσημη ανάθεση έγινε πριν από ${topic.days_since_activation ?? 'n/a'} ημέρες</p>
        </div>
    `;
    // Student Information, displayed in two columns
    document.getElementById('studentContent').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong class="text-bordeaux">Ονοματεπώνυμο:</strong> ${topic.full_student_name}</p>
                <p><strong class="text-bordeaux">Αριθμός Μητρώου:</strong> ${topic.student_id}</p>
                <p><strong class="text-bordeaux">Πατρώνυμο:</strong> ${topic.father_name}</p>
            </div>
            <div class="col-md-6">
                <p><strong class="text-bordeaux">Email:</strong> ${topic.student_email}</p>
                <p><strong class="text-bordeaux">Κινητό Τηλέφωνο:</strong> ${topic.mobile_telephone}</p>
                <p><strong class="text-bordeaux">Σταθερό Τηλέφωνο:</strong> ${topic.landline_telephone}</p>
            </div>
        </div>
    `;
    // The commitee members information, displaying the instructor as well 
    document.getElementById('committeeContent').innerHTML = `
        <p><strong class="text-bordeaux">Επιβλέπων:</strong> ${topic.full_instructor_name}</p>
        <p><strong class="text-bordeaux">Μέλη Τριμελούς:</strong> ${(topic.member1 && topic.member2) ? `${topic.full_mentor_name}, ${topic.full_mentortwo_name}` : 'Δεν έχουν οριστεί μέλη τριμελούς'}</p>
    `;

    // The practical exam content, which can be different based on the state of the thesis topic
    if (topic.state === 'Ενεργή') {
        activeThesisContent(topic, detailsPage);
    } else if (topic.state === 'Υπό Εξέταση') {
        underExaminationThesisContent(topic);
    }
}

// If the state is 'Ενεργή', the secretary can enter the protocol number, the practical exam is not yet done, so we cannot upload it
function activeThesisContent(topic, detailsPage) {
    const practicalDiv = document.getElementById('practicalContent');           // Get the practical content div
    const protocolValue = topic.protocol_number ? topic.protocol_number : '';   // This is for the ΑΠ
    const isReadonly = topic.protocol_number ? 'readonly' : '';                 // If ΑΠ is already set, the input field is readonly
    const buttonDisplay = topic.protocol_number ? 'style="display: none;"' : '';    // If ΑΠ is already set, the button to save it is hidden

    // Display the practical exam content for the active state 
    practicalDiv.innerHTML = `
        <p>Καταχωρίστε τον Αριθμό Πρωτοκόλλου:</p>
        <div class="d-flex align-items-center">
            <input id="protocolInput" type="text" class="form-control form-control-sm w-auto me-2" style="width: 10rem; background-color: #fff;" placeholder="Αριθμός Πρωτοκόλλου" value="${protocolValue}" ${isReadonly}>
            <button id="submitProtocolBtn" class="btn btn-outline-bordeaux btn-sm" data-id="${topic.thesis_id}" ${buttonDisplay}>
                Καταχώριση Αριθμού Πρωτοκόλλου
            </button>
        </div>
        <p class="text-muted mt-4">${topic.protocol_number ? 'Ο αριθμός πρωτοκόλλου έχει ήδη καταχωρηθεί.' : 'Η διπλωματική εργασία δεν έχει ακόμη εξετασθεί'}</p>
    `;

    // Add event listener for the submit button
    // Add listener to the protocol submit button
    document.getElementById('submitProtocolBtn').addEventListener('click', () => { attachProtocol() });

    // If the state is active, the secretary can delete the thesis
    // If the state is active we have to show the delete button
    // When the user presses it a modal asking for details and confirmation pops up
    // The following if condition handles all the above
    // Create a wrapper div for centering and spacing
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'd-flex justify-content-center mt-4 mb-5 delete-button-wrapper'; // Center and add space, add unique class

    // The delete button that allows the secretary to delete the thesis topic
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-outline-danger w-25';
    deleteButton.textContent = 'Διαγραφή Διπλωματικής';
    // Add an event listener to the delete button
    deleteButton.addEventListener('click', () => {
        const confirmBtn = document.getElementById('confirmDeleteBtn');     // Get the confirm button inside the modal
        confirmBtn.dataset.thesisId = topic.thesis_id;                      // Save the thesis ID to the dataset attribute
        document.getElementById('assemblyNumber').value = '';               // Clear the assembly number input
        const modal = new bootstrap.Modal(document.getElementById('deleteThesisModal'));    // Create the modal instance
        modal.show();   // Show the modal for confirmation
    });
    // The below is used so that the delete button is at the bottom of the page 
    buttonWrapper.appendChild(deleteButton);    // Append the delete button to the wrapper
    detailsPage.appendChild(buttonWrapper);     // Add the wrapper at the bottom of the details page

    // This is the part that does the deletion, when the confirm button is pressed
    document.getElementById('confirmDeleteBtn').addEventListener('click', function () { deleteActiveThesis(this.dataset.thesisId); });
} 

// Function to handle the submission of the protocol number
async function attachProtocol() {
    const protocolNumber = document.getElementById('protocolInput').value.trim();           // Get the value of the protocol input field
    const thesisId = document.getElementById('submitProtocolBtn').getAttribute('data-id');  // Get the thesis ID from the button's data attribute

    // Validate the protocol number
    if (!protocolNumber) {
        showCustomAlert('Παρακαλώ εισάγετε έναν αριθμό πρωτοκόλλου.');
        return;
    }

    try {
        const response = await fetch('/submit-protocol-number', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thesis_id: thesisId, protocol_number: protocolNumber })
        });
        const result = await response.json();
        if (response.ok) {
            showCustomAlert('Ο αριθμός πρωτοκόλλου καταχωρήθηκε με επιτυχία.');
            lockExaminationFields(); // Lock the input field and hide the button
        } else {
            showCustomAlert('Σφάλμα κατά την αποθήκευση: ' + result.error);
        }
    } catch (err) {
        showCustomAlert('Σφάλμα δικτύου: ' + err.message);
    }
}

async function deleteActiveThesis(thesisId) {
    if (!thesisId) return;
    // Get the informtation from the modal about the deletion that will be stored in th db 
    const reason = document.getElementById('deleteReason').value.trim();
    const assembly_number = document.getElementById('assemblyNumber').value.trim();
    const assembly_year = document.getElementById('assemblyYear').value.trim();

    // Check if both fields are filled
    if (!assembly_number || !assembly_year) {
        showCustomAlert('Παρακαλώ συμπληρώστε τον αριθμό και το έτος απόφασης Γενικής Συνέλευσης.');
        return;
    }

    try {
        // Request deletion
        const response = await fetch(`/delete-thesis/${thesisId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                thesis_id: thesisId,
                reason: reason,
                assembly_number: assembly_number,
                assembly_year: assembly_year
            })
        });

        const result = await response.json();

        // If the deletion was successful, show a success message and close the modal
        // Otherwise, show an error message
        if (response.ok && result.success) {
            // Success message
            showCustomAlert('Η διαγραφή ολοκληρώθηκε.', () => {
                // Hide the modal
                const modalElement = document.getElementById('deleteThesisModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();

                // Fetch to get the current list, after a deletion was made
                fetch('/thesis-topics')
                .then(res => res.json())
                .then(data => {
                    allTheses = data;
                    backToList();           // Call the function that shows the list 
                    
                    // Apply the selected filter that the secretary has choosen before 
                    const selected = document.getElementById('stateFilter').value;  // Get the default value (all) if the secretary hadn't choosen a filter
                    const filtered = selected === 'all' ? allTheses : allTheses.filter(t => t.state === selected);
                    displayTheses(filtered);   // Call the function that displays the listing 
                    });
                });
        } else {
            showCustomAlert(result.message || 'Αποτυχία διαγραφής.');
        }
    } catch (err) {
        showCustomAlert('Σφάλμα δικτύου.');
    }
}

// If the state is 'Υπό Εξέταση', we use the following function
function underExaminationThesisContent(topic) {
    if (topic.nimertis_link && topic.final_grade) {
        // If the practical exam is already done, display the nimertis link and the final grade
        document.getElementById('practicalContent').innerHTML = `
            <p>Η πρακτική εξέταση έχει ολοκληρωθεί</p>
            <p>Μπορείτε να δείτε τον σύνδεσμο προς το Νημερτή <a href="${topic.nimertis_link}" target="_blank">εδώ</a>.</p>
            <p>Τελικός Βαθμός: ${topic.final_grade}</p>
            <p>Επιλέξτε "Περάτωση Διπλωματικής Εργασίας" για να ολοκληρωθεί η διαδικασία</p>
            <button id="finalizeThesisBtn" class="btn btn-outline-bordeaux mt-3">Περάτωση Διπλωματικής Εργασίας</button>
        `;

        const finalizeBtn = document.getElementById('finalizeThesisBtn'); // Get the finalize button
        // If the button exists 
        if (finalizeBtn) {
            finalizeBtn.addEventListener('click', () => {
                fetch('/finalize-thesis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ thesis_id: topic.thesis_id })
                })
                .then(res => res.json())
                .then(result => {
                if (result.success) {
                    showCustomAlert('Η διπλωματική εργασία περατώθηκε επιτυχώς.', () => {
                        // Fetch to get the current list, after a deletion was made
                        fetch('/thesis-topics')
                        .then(res => res.json())
                        .then(data => {
                        allTheses = data;
                        backToList();           // Call the function that shows the list 

                        // Apply the selected filter that the secretary has choosen before 
                        const selected = document.getElementById('stateFilter').value;  // Get the default value (all) if the secretary hadn't choosen a filter
                        const filtered = selected === 'all' ? allTheses : allTheses.filter(t => t.state === selected);
                        displayTheses(filtered);   // Call the function that displays the listing 
                        });
                    });
                    } else {
                        showCustomAlert('Σφάλμα: ' + result.error);
                    }
                })
                .catch(() => {
                    showCustomAlert('Σφάλμα δικτύου.');
                });
            });
        }
    } else {
        // If the practical exam is not yet done, prompt to finalize the thesis
        document.getElementById('practicalContent').innerHTML = `
            <p>Η πρακτική εξέταση δεν έχει ολοκληρωθεί ακόμη.</p>
        `;
    }
}

// --------------------------------------------------------------------------------------- //
// Helper functions

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
            sessionStorage.removeItem('secretaryActiveSection'); // Clear the saved section so next login starts from the default page
            window.location.href = '/logout'; // Go to the logout route
        });
    }
}

// Function for the successful submission of the thesis protocol number
function lockExaminationFields() {
    const input = document.getElementById('protocolInput');
    const button = document.getElementById('submitProtocolBtn');

    if (input) {
        input.setAttribute('readonly', true);
        input.classList.add('bordeaux-outline');
    }

    if (button) {
        button.style.display = 'none';
    }
}

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

// Function to hide all sections when the sidebar is toggled
function hideAllSections() {
    const allSections = [
        document.getElementById('addUserForm'),
        document.getElementById('thesisList'),
        document.getElementById('dashboardTitle'),
        document.getElementById('thesisDetailsPage')
    ];

    allSections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

// Function to show a specific section and hide others
function showSection(sectionId, title) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
    updateMainTitle(title);
}

function updateMainTitle(title) {
    const mainTitle = document.getElementById('mainTitle') || document.getElementById('dashboardTitle');
    if (mainTitle) mainTitle.textContent = title;
}

// Function to go back to the thesis list from the details page
function backToList() {
    document.getElementById('thesisDetailsPage').style.display = 'none';    // Hide the more details of the thesis
    document.getElementById('thesisList').style.display = 'block';          // Show the thesis list again 
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
