// Professor Dashboard JavaScript - Clean Version
document.addEventListener('DOMContentLoaded', function() {
    // Check Chart.js availability
    console.log('Chart.js availability:', typeof Chart !== 'undefined' ? 'Available' : 'Not available');
    
    // Initialize variables
    let selectedTopic = null;
    let selectedStudent = null;
    let allTheses = [];
    let currentUserRole = null; // User's role for the current thesis (supervisor, committee_member, etc.)
    
    // Initialize components
    initializeSidebar();
    initializeLogout();
    initializeNavigationLinks(); // Add this to handle all navigation
    initializeCreateTopic();
    initializeAssignTopic();
    initializeMyTheses();
    initializeStatistics(); // Add UC12 Statistics functionality
    initializeCommitteeInvitations(); // Add UC11 Committee Invitations functionality
    
    // Show statistics as the default home page
    showStatisticsAsHomePage();
    
    // ===== NOTIFICATION SYSTEM =====
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `custom-notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Make showNotification globally available
    window.showNotification = showNotification;

    // ===== CUSTOM CONFIRMATION MODAL =====
    function showCustomConfirmation(options) {
        const {
            title = 'Επιβεβαίωση',
            message = 'Είστε βέβαιοι;',
            icon = 'fas fa-question-circle',
            iconColor = 'text-warning',
            confirmText = 'Επιβεβαίωση',
            confirmClass = 'btn-danger',
            cancelText = 'Ακύρωση',
            thesisInfo = '',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        return new Promise((resolve) => {
            const modal = document.getElementById('cancelAssignmentModal');
            if (!modal) {
                console.error('Cancel assignment modal not found');
                resolve(false);
                return;
            }

            // Update modal content
            const modalTitle = modal.querySelector('#cancelAssignmentModalLabel');
            const modalIcon = modal.querySelector('.modal-body .fas');
            const modalMessage = modal.querySelector('.fs-5');
            const modalThesisInfo = modal.querySelector('#cancelAssignmentThesisInfo');
            const confirmBtn = modal.querySelector('#confirmCancelAssignment');
            const cancelBtn = modal.querySelector('[data-bs-dismiss="modal"]');

            if (modalTitle) modalTitle.innerHTML = `<i class="${icon} me-2"></i>${title}`;
            if (modalIcon) modalIcon.className = icon + ' ' + iconColor;
            if (modalMessage) modalMessage.textContent = message;
            if (modalThesisInfo) modalThesisInfo.innerHTML = thesisInfo;
            if (confirmBtn) {
                confirmBtn.innerHTML = `<i class="fas fa-times me-2"></i>${confirmText}`;
                confirmBtn.className = `btn px-4 ${confirmClass}`;
            }
            if (cancelBtn) {
                cancelBtn.innerHTML = `<i class="fas fa-arrow-left me-2"></i>${cancelText}`;
            }

            // Handle confirmation
            const handleConfirm = () => {
                modal.removeEventListener('hidden.bs.modal', handleCancel);
                confirmBtn.removeEventListener('click', handleConfirm);
                onConfirm();
                resolve(true);
                bootstrap.Modal.getInstance(modal).hide();
            };

            // Handle cancellation
            const handleCancel = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                modal.removeEventListener('hidden.bs.modal', handleCancel);
                onCancel();
                resolve(false);
            };

            // Add event listeners
            confirmBtn.addEventListener('click', handleConfirm);
            modal.addEventListener('hidden.bs.modal', handleCancel);

            // Show modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        });
    }

    // Make custom confirmation globally available
    window.showCustomConfirmation = showCustomConfirmation;
    
    // Make invitation filter clearing globally available
    window.clearInvitationFilters = function() {
        const statusFilter = document.getElementById('invitationStatusFilter');
        const searchInput = document.getElementById('invitationsSearch');
        
        if (statusFilter) statusFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        // Find and call the applyInvitationFilters function
        const event = new CustomEvent('clearFilters');
        document.dispatchEvent(event);
    };

    // ===== SIDEBAR FUNCTIONALITY =====
    function initializeSidebar() {
        console.log('Initializing sidebar...');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        const toggleBtn = document.querySelector('.navbar-toggler');
        
        console.log('Sidebar element:', sidebar);
        console.log('Main content element:', mainContent);
        console.log('Toggle button element:', toggleBtn);
        
        // Toggle sidebar
        if (toggleBtn) {
            console.log('Adding click listener to toggle button');
            toggleBtn.addEventListener('click', function() {
                console.log('Toggle button clicked!');
                
                if (sidebar && mainContent) {
                    // Check current state by looking at the computed left position
                    const currentLeft = window.getComputedStyle(sidebar).left;
                    const isHidden = parseInt(currentLeft) < 0;
                    
                    console.log('Current sidebar left:', currentLeft, 'Is hidden:', isHidden);
                    
                    if (isHidden) {
                        // Show sidebar
                        console.log('Showing sidebar');
                        sidebar.style.left = '0px';
                        mainContent.style.marginLeft = '250px';
                        mainContent.style.width = 'calc(100% - 250px)';
                    } else {
                        // Hide sidebar
                        console.log('Hiding sidebar');
                        sidebar.style.left = '-250px';
                        mainContent.style.marginLeft = '0';
                        mainContent.style.width = '100%';
                    }
                } else {
                    console.error('Sidebar or main content element not found!');
                }
            });
        } else {
            console.log('Toggle button not found!');
        }
    }
    
    // ===== LOGOUT FUNCTIONALITY =====
    function initializeLogout() {
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
                logoutModal.show();
            });
        }

        const confirmLogoutBtn = document.getElementById('confirmLogout');
        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', function() {
                window.location.href = '/logout';
            });
        }
    }
    
    // ===== NAVIGATION LINKS =====
    function initializeNavigationLinks() {
        // Home link - show statistics as the home page
        const homeLinks = document.querySelectorAll('.nav-link[href="#"]:not([id])');
        homeLinks.forEach(link => {
            if (link.textContent.includes('Αρχική')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    showStatisticsAsHomePage();
                    
                    // Set this as active
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            }
        });
        
        // Other navigation links that are not yet implemented
        // Note: Committee Invitations is handled by initializeCommitteeInvitations(), so we exclude it here
        // Note: Statistics are now part of the home page
        const notImplementedLinks = document.querySelectorAll('.nav-link[href="#"]:not([id])');
        notImplementedLinks.forEach(link => {
            if (!link.textContent.includes('Αρχική') && 
                !link.textContent.includes('Δημιουργία') && 
                !link.textContent.includes('Ανάθεση') && 
                !link.textContent.includes('Διπλωματικές') &&
                !link.textContent.includes('Προσκλήσεις')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideAllForms();
                    showNotification('Αυτή η λειτουργία δεν έχει υλοποιηθεί ακόμα.', 'info');
                    
                    // Set this as active
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            }
        });
    }
    
    // ===== CREATE TOPIC FUNCTIONALITY =====
    function initializeCreateTopic() {
        const createTopicLink = document.getElementById('createTopicLink');
        const createTopicForm = document.getElementById('createTopicForm');
        
        if (createTopicLink) {
            createTopicLink.addEventListener('click', function(e) {
                e.preventDefault();
                hideAllForms();
                if (createTopicForm) {
                    createTopicForm.style.display = 'block';
                    updateMainTitle('Δημιουργία Νέου Θέματος');
                }
                
                // Set this as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
            });
        }

        // Handle form submission
        const topicForm = document.getElementById('thesisTopicForm');
        if (topicForm) {
            topicForm.addEventListener('submit', function(e) {
                e.preventDefault();
                createNewTopic();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelTopicForm');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                hideAllForms();
                updateMainTitle('Πίνακας Ελέγχου Καθηγητή');
                
                // Set "Αρχική" as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                const homeLink = document.querySelector('.nav-link[href="#"]:not([id])');
                if (homeLink && homeLink.textContent.includes('Αρχική')) {
                    homeLink.classList.add('active');
                }
            });
        }
    }
    
    // ===== ASSIGN TOPIC FUNCTIONALITY =====
    function initializeAssignTopic() {
        const assignTopicLink = document.getElementById('assignTopicLink');
        const assignTopicForm = document.getElementById('assignTopicForm');
        
        if (assignTopicLink) {
            assignTopicLink.addEventListener('click', function(e) {
                e.preventDefault();
                hideAllForms();
                if (assignTopicForm) {
                    assignTopicForm.style.display = 'block';
                    updateMainTitle('Ανάθεση Θέματος');
                    loadAvailableTopics();
                    loadAvailableTopicsForDisplay(); // Load topics for the new display section
                }
                
                // Set this as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
            });
        }

        // Initialize search functionality
        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('input', debounce(searchStudents, 300));
        }
    }
    
    // Load available topics for display in the new section
    async function loadAvailableTopicsForDisplay() {
        const loadingDiv = document.getElementById('availableTopicsLoading');
        const contentDiv = document.getElementById('availableTopicsContent');
        const noTopicsDiv = document.getElementById('noAvailableTopics');
        const cardsContainer = document.getElementById('availableTopicsCards');
        
        try {
            // Show loading
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (contentDiv) contentDiv.style.display = 'none';
            if (noTopicsDiv) noTopicsDiv.style.display = 'none';
            
            console.log('Loading available topics for display...');
            const response = await fetch('/api/professor/available-topics');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const topics = await response.json();
            console.log('Available topics received:', topics);
            
            // Hide loading
            if (loadingDiv) loadingDiv.style.display = 'none';
            
            if (!topics || topics.length === 0) {
                if (noTopicsDiv) noTopicsDiv.style.display = 'block';
                return;
            }
            
            // Show content and populate cards
            if (contentDiv) contentDiv.style.display = 'block';
            if (cardsContainer) {
                displayAvailableTopicsCards(topics);
            }
            
        } catch (error) {
            console.error('Error loading available topics for display:', error);
            if (loadingDiv) {
                loadingDiv.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Σφάλμα κατά τη φόρτωση των διαθέσιμων θεμάτων: ' + error.message + '</div>';
            }
        }
    }
    
    // Display available topics as cards
    function displayAvailableTopicsCards(topics) {
        const container = document.getElementById('availableTopicsCards');
        if (!container) return;
        
        let html = '<div class="row">';
        
        topics.forEach(topic => {
            html += `
                <div class="col-lg-6 col-xl-4 mb-3">
                    <div class="card h-100 border-0 shadow-sm position-relative">
                        <button type="button" class="btn btn-outline-danger btn-sm position-absolute top-0 end-0 m-2" 
                                style="z-index: 10; padding: 0.25rem 0.5rem;" 
                                onclick="deleteTopic('${topic.thesis_id}', '${topic.title.replace(/'/g, "\\'")}')"
                                title="Διαγραφή θέματος">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <div class="card-body d-flex flex-column">
                            <div class="mb-3">
                                <h6 class="card-title text-bordeaux fw-bold mb-2 pe-5">${topic.title}</h6>
                                <p class="card-text text-muted small mb-2" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${topic.description}
                                </p>
                            </div>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar me-1"></i>
                                        ${formatDate(topic.created_at)}
                                    </small>
                                    <span class="badge bg-success">Διαθέσιμο</span>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-outline-bordeaux btn-sm" 
                                            onclick="selectTopicForAssignment('${topic.thesis_id}', '${topic.title.replace(/'/g, "\\'")}')">
                                        <i class="fas fa-hand-pointer me-1"></i>Επιλογή για Ανάθεση
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Select topic for assignment (called from onclick)
    window.selectTopicForAssignment = function(topicId, topicTitle) {
        const topicSelect = document.getElementById('topicSelect');
        if (topicSelect) {
            topicSelect.value = topicId;
            
            // Trigger change event to update topic info
            const changeEvent = new Event('change');
            topicSelect.dispatchEvent(changeEvent);
            
            // Scroll to the assignment form
            document.getElementById('topicSelect').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            showNotification(`Θέμα "${topicTitle}" επιλέχθηκε για ανάθεση`, 'success');
        }
    };

    // Delete topic function (called from onclick)
    window.deleteTopic = function(topicId, topicTitle) {
        // Show confirmation dialog
        const confirmMessage = `Είστε βέβαιοι ότι θέλετε να διαγράψετε το θέμα "${topicTitle}"?\n\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί.`;
        
        if (confirm(confirmMessage)) {
            deleteTopicFromServer(topicId, topicTitle);
        }
    };

    // API call to delete topic
    async function deleteTopicFromServer(topicId, topicTitle) {
        try {
            showNotification('Διαγραφή θέματος σε εξέλιξη...', 'info');
            
            const response = await fetch('/api/professor/delete-topic', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topicId: topicId })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification(`Το θέμα "${topicTitle}" διαγράφηκε επιτυχώς!`, 'success');
                
                // Refresh available topics lists
                loadAvailableTopics();
                loadAvailableTopicsForDisplay();
                
                // Also refresh my theses list if it's currently displayed
                const myThesesList = document.getElementById('myThesesList');
                if (myThesesList && myThesesList.style.display !== 'none') {
                    loadMyTheses();
                }
            } else {
                throw new Error(result.message || 'Σφάλμα κατά τη διαγραφή θέματος');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            showNotification('Σφάλμα: ' + error.message, 'error');
        }
    }
    
    // ===== MY THESES FUNCTIONALITY =====
    function initializeMyTheses() {
        const myThesesLink = document.getElementById('myThesesLink');
        const myThesesList = document.getElementById('myThesesList');
        
        if (myThesesLink) {
            myThesesLink.addEventListener('click', function(e) {
                e.preventDefault();
                hideAllForms();
                if (myThesesList) {
                    myThesesList.style.display = 'block';
                    updateMainTitle('Οι Διπλωματικές Μου');
                    loadMyTheses();
                    initializeThesesFilters();
                }
                
                // Set this as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
            });
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    function hideAllForms() {
        const forms = ['createTopicForm', 'assignTopicForm', 'myThesesList', 'thesisDetailsView', 'editThesisForm', 'statisticsSection', 'committeeInvitationsSection'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'none';
            }
        });
        
        console.log('All forms hidden'); // Debug log
    }

    function showSection(sectionId) {
        hideAllForms();
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
            console.log(`Showing section: ${sectionId}`);
        } else {
            console.error(`Section not found: ${sectionId}`);
        }
    }
    
    function updateMainTitle(title) {
        // Try to find a title element - could be h1, h2, or specific ID
        const mainTitle = document.getElementById('mainTitle') || 
                         document.querySelector('.main-title') || 
                         document.querySelector('h1') || 
                         document.querySelector('h2');
        if (mainTitle) {
            mainTitle.textContent = title;
        }
        console.log('Updated main title to:', title);
    }
    
    function showAlert(message, type = 'danger') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Find a suitable container for the alert
        const container = document.querySelector('.main-content') || document.body;
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-dismiss success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                const alertElement = container.querySelector('.alert-success');
                if (alertElement) {
                    // Use Bootstrap's alert dismissal
                    const bsAlert = new bootstrap.Alert(alertElement);
                    bsAlert.close();
                }
            }, 3000);
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ===== API FUNCTIONS =====
    
    // Create new topic
    function createNewTopic() {
        const form = document.getElementById('thesisTopicForm');
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Δημιουργία...';
        submitBtn.disabled = true;
        
        fetch('/api/professor/create-topic', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Το θέμα δημιουργήθηκε επιτυχώς!', 'success');
                form.reset(); // Καθαρίζει το form για νέα καταχώρηση
                
                // Δεν κρύβουμε το form - το αφήνουμε ανοιχτό για νέα δημιουργία
                // hideAllForms();
                // updateMainTitle('Πίνακας Ελέγχου Καθηγητή');
                
                // Refresh available topics lists since we added a new topic
                loadAvailableTopics();
                loadAvailableTopicsForDisplay();
                
                // Also refresh my theses list
                loadMyTheses();
            } else {
                showAlert(data.message || 'Σφάλμα κατά τη δημιουργία του θέματος');
            }
        })
        .catch(error => {
            console.error('Error creating topic:', error);
            showAlert('Σφάλμα κατά τη δημιουργία του θέματος');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
    
    // Load available topics for assignment
    function loadAvailableTopics() {
        fetch('/api/professor/available-topics')
        .then(response => response.json())
        .then(topics => {
            const topicSelect = document.getElementById('topicSelect');
            if (topicSelect) {
                topicSelect.innerHTML = '<option value="">Επιλέξτε θέμα...</option>';
                topics.forEach(topic => {
                    topicSelect.innerHTML += `<option value="${topic.thesis_id}">${topic.title}</option>`;
                });
                
                topicSelect.addEventListener('change', function() {
                    selectedTopic = topics.find(t => t.thesis_id == this.value);
                    updateTopicInfo();
                });
            }
        })
        .catch(error => {
            console.error('Error loading topics:', error);
            showAlert('Σφάλμα κατά τη φόρτωση των θεμάτων');
        });
    }
    
    // Search students (only available students without thesis)
    function searchStudents() {
        const searchTerm = document.getElementById('studentSearch').value;
        
        if (searchTerm.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
        
        fetch(`/api/professor/search-students?term=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(students => {
            const resultsContainer = document.getElementById('searchResults');
            if (resultsContainer) {
                if (students.length === 0) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Δεν βρέθηκαν διαθέσιμοι φοιτητές με αυτόν τον όρο αναζήτησης.
                            <br><small class="text-muted">Εμφανίζονται μόνο φοιτητές που δεν έχουν ήδη ανατεθεί θέμα διπλωματικής.</small>
                        </div>
                    `;
                } else {
                    resultsContainer.innerHTML = students.map(student => `
                        <div class="student-result p-2 border rounded mb-2" style="cursor: pointer;" 
                             onclick="selectStudent(${JSON.stringify(student).replace(/"/g, '&quot;')})">
                            <strong>${student.name} ${student.surname}</strong><br>
                            <small>ΑΜ: ${student.student_number} | Email: ${student.email}</small>
                        </div>
                    `).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error searching students:', error);
            showAlert('Σφάλμα κατά την αναζήτηση φοιτητών');
        });
    }
    
    // Load professor's theses
    function loadMyTheses() {
        console.log('Loading my theses...');
        
        fetch('/api/professor/my-theses')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(theses => {
            console.log('Received theses:', theses);
            allTheses = theses;
            
            // Initially display all theses and update counters
            displayTheses(theses, true);
            
            // Apply any existing filters
            setTimeout(() => {
                applyThesesFilters();
            }, 100);
        })
        .catch(error => {
            console.error('Error loading theses:', error);
            
            // Hide loading, show error
            const loading = document.getElementById('thesesLoading');
            const container = document.getElementById('thesesCardsContainer');
            const noFound = document.getElementById('noThesesFound');
            
            if (loading) loading.style.display = 'none';
            if (container) container.style.display = 'none';
            if (noFound) {
                noFound.style.display = 'block';
                noFound.innerHTML = '<div class="text-center py-5"><i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i><h5>Σφάλμα φόρτωσης</h5><p>Δεν ήταν δυνατή η φόρτωση των διπλωματικών.</p><button class="btn btn-bordeaux" onclick="location.reload()">Ανανέωση</button></div>';
            }
        });
    }
    
    // Display theses
    function displayTheses(theses, updateCounters = true) {
        console.log('Displaying theses:', theses);
        
        const container = document.getElementById('thesesCardsContainer');
        const loadingElement = document.getElementById('thesesLoading');
        const noThesesElement = document.getElementById('noThesesFound');
        
        if (!container) {
            console.error('Theses cards container not found');
            return;
        }
        
        // Update counters only if explicitly requested (e.g., on initial load)
        if (updateCounters) {
            updateThesesCounters(theses);
        }
        
        // Hide loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (!theses || theses.length === 0) {
            container.style.display = 'none';
            if (noThesesElement) {
                noThesesElement.style.display = 'block';
            }
            return;
        }
        
        // Show container
        container.style.display = 'block';
        if (noThesesElement) {
            noThesesElement.style.display = 'none';
        }
        
        // Generate HTML using proper string concatenation
        let html = '';
        
        theses.forEach(function(thesis) {
            html += '<div class="card mb-3 thesis-card-clickable" onclick="viewThesisDetails(' + thesis.id + ')" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.15)\'" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 2px 4px rgba(0,0,0,0.1)\'">' +
                '<div class="card-body">' +
                '<div class="row align-items-center">' +
                '<div class="col-md-10">' +
                '<h5 class="card-title text-bordeaux mb-2">' + (thesis.title || 'Άγνωστος τίτλος') + '</h5>' +
                '<div class="row">' +
                '<div class="col-sm-6">' +
                '<p class="mb-1"><strong>Φοιτητής:</strong> ' + (thesis.student || 'Μη ανατεθειμένη') + '</p>' +
                '<p class="mb-1"><small class="text-muted">ΑΜ: ' + (thesis.studentId || 'Μη διαθέσιμο') + '</small></p>' +
                '</div>' +
                '<div class="col-sm-6">' +
                '<p class="mb-1"><strong>Ανάθεση:</strong> ' + formatDate(thesis.assignDate) + '</p>' +
                '<p class="mb-1"><strong>Διάρκεια:</strong> ' + formatDuration(thesis.duration) + '</p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="col-md-2 text-end">' +
                '<div class="mb-2">' +
                '<span class="badge ' + getStatusBadgeClass(thesis.status) + ' me-2">' +
                (thesis.status || 'Άγνωστη κατάσταση') +
                '</span>' +
                '<span class="badge ' + getRoleBadgeClass(thesis.role) + '">' +
                getRoleText(thesis.role) +
                '</span>' +
                '</div>' +
                '<div class="text-muted small">' +
                '<i class="fas fa-eye me-1"></i>Κλικ για προβολή' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        });
        
        container.innerHTML = html;
    }
    
    // Update theses counters (for initial load - shows all as both total and filtered)
    function updateThesesCounters(allTheses) {
        console.log('Updating counters on initial load - Count:', allTheses.length);
        
        const totalCount = allTheses.length;
        const filteredCount = allTheses.length; // Initially, all theses are shown
        
        const totalElement = document.getElementById('totalThesesCount');
        const filteredElement = document.getElementById('filteredThesesCount');
        
        if (totalElement) {
            totalElement.textContent = totalCount;
            console.log('Updated total count to:', totalCount);
        } else {
            console.warn('totalThesesCount element not found');
        }
        if (filteredElement) {
            filteredElement.textContent = filteredCount;
            console.log('Updated filtered count to:', filteredCount);
        } else {
            console.warn('filteredThesesCount element not found');
        }
    }
    
    // Get role display text
    function getRoleText(role) {
        const roleTexts = {
            'supervisor': 'Επιβλέπων',
            'member': 'Μέλος Επιτροπής',
            'secretary': 'Γραμματέας'
        };
        return roleTexts[role] || 'Άγνωστος ρόλος';
    }
    
    // Helper functions for topic assignment
    function updateTopicInfo() {
        const infoContainer = document.getElementById('selectedTopicInfo');
        if (infoContainer && selectedTopic) {
            infoContainer.innerHTML = `
                <div class="alert alert-info">
                    <h6>${selectedTopic.title}</h6>
                    <p class="mb-0">${selectedTopic.description}</p>
                </div>
            `;
        }
        checkAssignmentForm();
    }
    
    // Global function for student selection (called from onclick)
    window.selectStudent = function(student) {
        selectedStudent = student;
        const infoContainer = document.getElementById('selectedStudentInfo');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="alert alert-success">
                    <h6>${student.name} ${student.surname}</h6>
                    <p class="mb-0">ΑΜ: ${student.student_number} | Email: ${student.email}</p>
                </div>
            `;
        }
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('studentSearch').value = '';
        checkAssignmentForm();
    };
    
    function checkAssignmentForm() {
        const assignBtn = document.getElementById('assignTopicBtn');
        if (assignBtn) {
            assignBtn.disabled = !(selectedTopic && selectedStudent);
        }
    }
    
    // Handle topic assignment
    document.addEventListener('click', function(e) {
        if (e.target.id === 'assignTopicBtn') {
            if (selectedTopic && selectedStudent) {
                assignTopicToStudent(selectedTopic.thesis_id, selectedStudent.student_number);
            }
        }
    });
    
    function assignTopicToStudent(topicId, studentId) {
        const assignBtn = document.getElementById('assignTopicBtn');
        const originalText = assignBtn.innerHTML;
        assignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ανάθεση...';
        assignBtn.disabled = true;
        
        fetch('/api/professor/assign-topic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topicId: topicId,
                studentId: studentId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Το θέμα ανατέθηκε επιτυχώς!', 'success');
                resetAssignmentForm();
                
                // Refresh available topics lists
                loadAvailableTopics();
                loadAvailableTopicsForDisplay();
                
                // Refresh my theses list
                loadMyTheses();
            } else {
                showAlert(data.message || 'Σφάλμα κατά την ανάθεση του θέματος');
            }
        })
        .catch(error => {
            console.error('Error assigning topic:', error);
            showAlert('Σφάλμα κατά την ανάθεση του θέματος');
        })
        .finally(() => {
            assignBtn.innerHTML = originalText;
            assignBtn.disabled = false;
        });
    }
    
    function resetAssignmentForm() {
        selectedTopic = null;
        selectedStudent = null;
        document.getElementById('topicSelect').value = '';
        document.getElementById('studentSearch').value = '';
        document.getElementById('selectedTopicInfo').innerHTML = '';
        document.getElementById('selectedStudentInfo').innerHTML = '';
        document.getElementById('searchResults').innerHTML = '';
        checkAssignmentForm();
    }
    
    // ===== HELPER FUNCTIONS =====
    function getStatusText(status) {
        const statusMap = {
            'Χωρίς Ανάθεση': 'Χωρίς Ανάθεση',
            'Υπό Ανάθεση': 'Υπό Ανάθεση',
            'Ενεργή': 'Ενεργή',
            'Υπό Εξέταση': 'Υπό Εξέταση',
            'Περατωμένη': 'Περατωμένη',
            'Ακυρωμένη': 'Ακυρωμένη'
        };
        return statusMap[status] || status;
    }

    function getRoleText(role) {
        const roleMap = {
            'supervisor': 'Επιβλέπων',
            'member': 'Μέλος Επιτροπής'
        };
        return roleMap[role] || role;
    }

    function getStatusBadgeClass(status) {
        const classMap = {
            'Χωρίς Ανάθεση': 'bg-secondary',
            'Υπό Ανάθεση': 'bg-warning',
            'Ενεργή': 'bg-primary',
            'Υπό Εξέταση': 'bg-info',
            'Περατωμένη': 'bg-success',
            'Ακυρωμένη': 'bg-danger'
        };
        return classMap[status] || 'bg-secondary';
    }

    function getRoleBadgeClass(role) {
        const classMap = {
            'supervisor': 'bg-dark',
            'member': 'bg-secondary'
        };
        return classMap[role] || 'bg-secondary';
    }

    function formatDate(dateString) {
        if (!dateString) return 'Μη διαθέσιμο';
        const date = new Date(dateString);
        return date.toLocaleDateString('el-GR');
    }

    function formatDuration(days) {
        if (!days || days <= 0) return 'Μη διαθέσιμο';
        if (days < 30) return `${days} ημέρες`;
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        if (remainingDays === 0) return `${months} μήνες`;
        return `${months} μήνες, ${remainingDays} ημέρες`;
    }
    
    // Initialize thesis filters
    function initializeThesesFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const searchInput = document.getElementById('thesesSearch');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const exportCsvOption = document.getElementById('exportCsvOption'); // CSV export option
        const exportJsonOption = document.getElementById('exportJsonOption'); // JSON export option
        
        if (statusFilter) {
            statusFilter.addEventListener('change', applyThesesFilters);
        }
        
        if (roleFilter) {
            roleFilter.addEventListener('change', applyThesesFilters);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', applyThesesFilters);
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                applyThesesFilters();
            });
        }
        
        // Add export functionality for dropdown options
        if (exportCsvOption) {
            exportCsvOption.addEventListener('click', function(e) {
                e.preventDefault();
                exportThesesToCsv();
            });
        }
        
        if (exportJsonOption) {
            exportJsonOption.addEventListener('click', function(e) {
                e.preventDefault();
                exportThesesToJson();
            });
        }
    }
    
    // Apply filters to theses list
    function applyThesesFilters() {
        let filteredTheses = allTheses;
        
        // Status filter with mapping from English to Greek
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter && statusFilter.value) {
            const statusMapping = {
                'unassigned': 'Χωρίς Ανάθεση',
                'under_assignment': 'Υπό Ανάθεση',
                'active': 'Ενεργή',
                'under_examination': 'Υπό Εξέταση',
                'completed': 'Περατωμένη',
                'cancelled': 'Ακυρωμένη'
            };
            
            const targetStatus = statusMapping[statusFilter.value];
            if (targetStatus) {
                filteredTheses = filteredTheses.filter(thesis => 
                    thesis.status === targetStatus
                );
            }
        }
        
        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter && roleFilter.value) {
            filteredTheses = filteredTheses.filter(thesis => 
                thesis.role === roleFilter.value
            );
        }
        
        // Search filter
        const searchInput = document.getElementById('thesesSearch');
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filteredTheses = filteredTheses.filter(thesis => 
                (thesis.title && thesis.title.toLowerCase().includes(searchTerm)) ||
                (thesis.student && thesis.student.toLowerCase().includes(searchTerm)) ||
                (thesis.studentId && thesis.studentId.toString().includes(searchTerm))
            );
        }
        
        displayTheses(filteredTheses, false); // Don't update total counters, only display
        updateThesesCountersWithFilter(filteredTheses); // Update counters with proper total vs filtered logic
    }
    
    // Update counters with correct total vs filtered logic
    function updateThesesCountersWithFilter(filteredTheses) {
        console.log('Updating counters with filter - Total:', allTheses.length, 'Filtered:', filteredTheses.length);
        
        const totalCount = allTheses.length;
        const filteredCount = filteredTheses.length;
        
        const totalElement = document.getElementById('totalThesesCount');
        const filteredElement = document.getElementById('filteredThesesCount');
        
        if (totalElement) {
            totalElement.textContent = totalCount;
            console.log('Updated total count to:', totalCount);
        } else {
            console.warn('totalThesesCount element not found');
        }
        if (filteredElement) {
            filteredElement.textContent = filteredCount;
            console.log('Updated filtered count to:', filteredCount);
        } else {
            console.warn('filteredThesesCount element not found');
        }
    }
    
    // UC9: Thesis Details View Functions
    async function loadThesisDetails(thesisId, editMode = false) {
        const loadingDiv = document.getElementById('thesisDetailsLoading');
        const contentDiv = document.getElementById('thesisDetailsContent');
        
        try {
            loadingDiv.style.display = 'block';
            contentDiv.style.display = 'none';
            
            console.log('Loading thesis details for ID:', thesisId);
            const response = await fetch(`/api/professor/thesis-details/${thesisId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Thesis details received:', data);
            
            if (data.success) {
                displayThesisDetails(data.data);
                
                // Initialize UC13 Notes system
                initializeThesisDetailsWithNotes(data.data.id);
                
                loadingDiv.style.display = 'none';
                contentDiv.style.display = 'block';
                
                // If edit mode is requested, automatically open edit form
                if (editMode && data.data.my_role === 'supervisor') {
                    setTimeout(() => {
                        toggleEditMode();
                    }, 500); // Small delay to ensure details are loaded
                }
            } else {
                throw new Error(data.message || 'Failed to load thesis details');
            }
        } catch (error) {
            console.error('Error loading thesis details:', error);
            loadingDiv.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Σφάλμα κατά τη φόρτωση των λεπτομερειών: ' + error.message + '</div>';
        }
    }

    function displayThesisDetails(thesis) {
        console.log('displayThesisDetails called with thesis:', thesis);
        
        // Store thesis data globally for use in edit form
        window.currentThesisData = thesis;
        
        // Store current user role for UC13 Notes system
        currentUserRole = thesis.my_role;
        
        // Basic Information
        document.getElementById('thesisTitle').textContent = thesis.title || '';
        document.getElementById('thesisDescription').textContent = thesis.description || '';
        document.getElementById('thesisCode').textContent = thesis.code || '';
        
        console.log('Thesis code:', thesis.code);
        console.log('Thesis created_at:', thesis.created_at);
        console.log('Thesis assigned_at:', thesis.assigned_at);
        console.log('Thesis duration:', thesis.duration);
        
        // Status badge
        const statusBadge = document.getElementById('thesisStatus');
        statusBadge.textContent = getStatusText(thesis.status);
        statusBadge.className = 'badge ' + getStatusBadgeClass(thesis.status);
        
        // Role badge
        const roleBadge = document.getElementById('myRole');
        roleBadge.textContent = getRoleText(thesis.my_role);
        roleBadge.className = 'badge ' + getRoleBadgeClass(thesis.my_role);
        
        // Dates
        document.getElementById('creationDate').textContent = formatDate(thesis.created_at);
        document.getElementById('assignmentDate').textContent = formatDate(thesis.assigned_at);
        document.getElementById('thesisDuration').textContent = formatDuration(thesis.duration);
        
        // Student Information (only if assigned)
        const studentSection = document.getElementById('studentInfoSection');
        if (thesis.student) {
            studentSection.style.display = 'block';
            document.getElementById('studentName').textContent = thesis.student.name || '';
            document.getElementById('studentNumber').textContent = thesis.student.studentNumber || '';
            
            const studentEmail = document.getElementById('studentEmail');
            if (thesis.student.email) {
                studentEmail.href = 'mailto:' + thesis.student.email;
                studentEmail.textContent = thesis.student.email;
            } else {
                studentEmail.textContent = 'Δεν είναι διαθέσιμο';
                studentEmail.removeAttribute('href');
            }
            
            document.getElementById('studentPhone').textContent = thesis.student.phone || 'Δεν είναι διαθέσιμο';
        } else {
            studentSection.style.display = 'none';
        }
        
        // Committee Information
        displayCommitteeDetails(thesis.committee || []);
        
        // Timeline
        displayThesisTimeline(thesis.timeline || []);
        
        // Final Grade Section
        const gradeSection = document.getElementById('gradeSection');
        if (thesis.final_grade && thesis.status === 'Περατωμένη') {
            gradeSection.style.display = 'block';
            document.getElementById('finalGrade').textContent = thesis.final_grade;
            document.getElementById('examDate').textContent = formatDate(thesis.exam_date);
            displayCommitteeComments(thesis.comments || []);
        } else {
            gradeSection.style.display = 'none';
        }
        
        // Files
        displayThesisFiles(thesis.files || [], thesis.pdf_file);
        
        // Action buttons
        displayThesisActions(thesis);
        
        // Initialize Notes System (UC13)
        initializeThesisDetailsWithNotes(thesis.id);
    }

    function displayCommitteeDetails(committee) {
        const container = document.getElementById('committeeDetails');
        
        if (!committee || committee.length === 0) {
            container.innerHTML = '<p class="text-muted">Η επιτροπή δεν έχει οριστεί ακόμα.</p>';
            return;
        }
        
        // Add CSS styling to limit container height and enable scrolling
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';
        container.style.paddingRight = '10px';
        
        let html = '';
        committee.forEach((member, index) => {
            const roleText = member.role === 'supervisor' ? 'Επιβλέπων' : 
                           member.role === 'member' ? 'Μέλος' : 
                           member.role === 'secretary' ? 'Γραμματέας' : member.role;
            
            const roleBadgeClass = member.role === 'supervisor' ? 'bg-success' : 
                                 member.role === 'member' ? 'bg-primary' : 
                                 member.role === 'secretary' ? 'bg-info' : 'bg-secondary';
            
            // Create more compact layout for committee members
            html += '<div class="committee-member mb-2 p-2 border rounded" style="background-color: #f8f9fa;">' +
                    '<div class="d-flex justify-content-between align-items-start">' +
                    '<div class="flex-grow-1 me-2">' +
                    '<strong style="font-size: 0.9rem;">' + (member.professor_name || 'Όνομα δεν διαθέσιμο') + '</strong><br>' +
                    '<small class="text-muted" style="font-size: 0.8rem;">' + (member.email || 'Email δεν διαθέσιμο') + '</small>' +
                    '</div>' +
                    '<span class="badge ' + roleBadgeClass + ' flex-shrink-0" style="font-size: 0.75rem;">' + roleText + '</span>' +
                    '</div>' +
                    '</div>';
        });
        
        container.innerHTML = html;
    }

    function displayThesisTimeline(events) {
        const container = document.getElementById('thesisTimeline');
        
        if (!events || events.length === 0) {
            container.innerHTML = '<p class="text-muted">Δεν υπάρχουν καταγεγραμμένα γεγονότα.</p>';
            return;
        }
        
        // Sort events by date (newest first)
        events.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
        
        let html = '<div class="timeline">';
        events.forEach((event, index) => {
            html += '<div class="timeline-item mb-3">' +
                    '<div class="d-flex">' +
                    '<div class="timeline-marker me-3">' +
                    '<i class="fas fa-circle text-bordeaux"></i>' +
                    '</div>' +
                    '<div class="timeline-content">' +
                    '<h6 class="fw-bold">' + event.event_type + '</h6>' +
                    '<p class="text-muted mb-1">' + event.description + '</p>' +
                    '<small class="text-muted">' + formatDate(event.event_date) + '</small>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    function displayCommitteeComments(comments) {
        const container = document.getElementById('committeeComments');
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="text-muted">Δεν υπάρχουν σχόλια από την επιτροπή.</p>';
            return;
        }
        
        let html = '';
        comments.forEach(comment => {
            html += '<div class="border-start border-3 border-bordeaux ps-3 mb-3">' +
                    '<h6 class="fw-bold">' + comment.author_name + '</h6>' +
                    '<p>' + comment.comment + '</p>' +
                    '<small class="text-muted">' + formatDate(comment.created_at) + '</small>' +
                    '</div>';
        });
        
        container.innerHTML = html;
    }

    function displayThesisFiles(files, pdfFile = null) {
        const container = document.getElementById('thesisFiles');
        
        let allFiles = [];
        
        // Add the original PDF file if it exists
        if (pdfFile) {
            allFiles.push({
                id: 'original-pdf',
                original_name: 'Αρχικό PDF Διπλωματικής',
                file_type: 'PDF',
                uploaded_at: null, // We don't have upload date for original PDF
                file_path: pdfFile,
                isOriginalPdf: true
            });
        }
        
        // Add other files
        if (files && files.length > 0) {
            allFiles = allFiles.concat(files);
        }
        
        if (allFiles.length === 0) {
            container.innerHTML = '<p class="text-muted">Δεν υπάρχουν συνημμένα αρχεία.</p>';
            return;
        }
        
        let html = '<div class="row">';
        allFiles.forEach(file => {
            const iconClass = getFileIcon(file.file_type);
            let downloadUrl = '';
            let fileName = file.original_name;
            let dateInfo = file.uploaded_at ? formatDate(file.uploaded_at) : 'Αρχικό αρχείο';
            
            if (file.isOriginalPdf) {
                downloadUrl = '/uploads/thesis-pdfs/' + file.file_path;
                fileName = '<span class="badge bg-info text-dark me-2">Αρχικό</span>' + fileName;
            } else {
                downloadUrl = '/api/thesis/file/' + file.id;
            }
            
            html += '<div class="col-md-6 mb-2">' +
                    '<div class="d-flex align-items-center p-2 border rounded">' +
                    '<i class="' + iconClass + ' me-2 text-bordeaux"></i>' +
                    '<div class="flex-grow-1">' +
                    '<span class="fw-bold">' + fileName + '</span><br>' +
                    '<small class="text-muted">' + file.file_type + ' • ' + dateInfo + '</small>' +
                    '</div>' +
                    '<a href="' + downloadUrl + '" class="btn btn-sm btn-outline-bordeaux" download>' +
                    '<i class="fas fa-download"></i>' +
                    '</a>' +
                    '</div>' +
                    '</div>';
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    function displayThesisActions(thesis) {
        const container = document.getElementById('thesisActions');
        let html = '';
        
        // Edit button (only for supervisors)
        if (thesis.my_role === 'supervisor') {
            html += '<button type="button" class="btn btn-warning" onclick="toggleEditMode()">' +
                    '<i class="fas fa-edit me-2"></i>Επεξεργασία' +
                    '</button>';
        }
        
        // Cancel assignment button (only for "Υπό Ανάθεση" status and supervisors)
        if (thesis.my_role === 'supervisor' && thesis.status === 'Υπό Ανάθεση') {
            html += '<button type="button" class="btn btn-danger" onclick="cancelThesisAssignmentFromDetails(' + thesis.id + ')" title="Ακύρωση ανάθεσης διπλωματικής">' +
                    '<i class="fas fa-times me-2"></i>Ακύρωση Ανάθεσης' +
                    '</button>';
        }
        
        // Cancel active thesis button (only for "Ενεργή" status, supervisors, and after 2 years)
        if (thesis.my_role === 'supervisor' && thesis.status === 'Ενεργή' && isThesisEligibleForCancellation(thesis)) {
            html += '<button type="button" class="btn btn-danger" onclick="cancelActiveThesis(' + thesis.id + ')" title="Ακύρωση ενεργής διπλωματικής (μετά από 2 έτη)">' +
                    '<i class="fas fa-ban me-2"></i>Ακύρωση Ενεργής Διπλωματικής' +
                    '</button>';
        }
        
        // Grading button (only for "Υπό Εξέταση" status and committee members/supervisors)
        if (thesis.status === 'Υπό Εξέταση' && (thesis.my_role === 'supervisor' || thesis.my_role === 'member')) {
            html += '<button type="button" class="btn btn-success" onclick="openGradingModal(' + thesis.id + ')" title="Βαθμολόγηση διπλωματικής εργασίας">' +
                    '<i class="fas fa-star me-2"></i>Βαθμολόγηση' +
                    '</button>';
        }
        
        // Export PDF button
        html += '<button type="button" class="btn btn-outline-bordeaux" onclick="exportThesisPDF(' + thesis.id + ')">' +
                '<i class="fas fa-file-pdf me-2"></i>Εξαγωγή PDF' +
                '</button>';
        
        container.innerHTML = html;
    }

    // Check if thesis is eligible for cancellation (2 years after assignment)
    function isThesisEligibleForCancellation(thesis) {
        if (!thesis.assigned_at) return false;
        
        const assignmentDate = new Date(thesis.assigned_at);
        const currentDate = new Date();
        const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
        
        return (currentDate - assignmentDate) >= twoYearsInMs;
    }

    function getFileIcon(fileType) {
        const type = fileType.toLowerCase();
        if (type.includes('pdf')) return 'fas fa-file-pdf';
        if (type.includes('word') || type.includes('doc')) return 'fas fa-file-word';
        if (type.includes('excel') || type.includes('sheet')) return 'fas fa-file-excel';
        if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'fas fa-file-image';
        return 'fas fa-file';
    }

    // Functions that might be called from HTML
    window.viewThesisDetails = function(thesisId, editMode = false) {
        console.log('View thesis details called with ID:', thesisId, 'Edit mode:', editMode);
        
        try {
            // Find the elements
            const myThesesList = document.getElementById('myThesesList');
            const thesisDetailsView = document.getElementById('thesisDetailsView');
            
            if (!myThesesList) {
                console.error('Element myThesesList not found');
                showNotification('Σφάλμα: Δεν βρέθηκε η λίστα διπλωματικών', 'error');
                return;
            }
            
            if (!thesisDetailsView) {
                console.error('Element thesisDetailsView not found');
                showNotification('Σφάλμα: Δεν βρέθηκε η σελίδα λεπτομερειών', 'error');
                return;
            }
            
            console.log('Elements found, switching views...');
            
            // Hide the theses list and show details view
            myThesesList.style.display = 'none';
            thesisDetailsView.style.display = 'block';
            
            console.log('Views switched, loading thesis details...');
            
            // Load the thesis details
            loadThesisDetails(thesisId, editMode);
        } catch (error) {
            console.error('Error in viewThesisDetails:', error);
            showNotification('Σφάλμα κατά την προβολή λεπτομερειών: ' + error.message, 'error');
        }
    };
    
    window.editThesis = function(thesisId) {
        console.log('Edit thesis:', thesisId);
        // Go to thesis details and automatically open edit form
        viewThesisDetails(thesisId, true); // true indicates edit mode
    };

    // UC7: Cancel Initial Topic Assignment
    window.cancelAssignment = function(thesisId) {
        console.log('Cancel assignment for thesis:', thesisId);
        
        // Find thesis information from allTheses array
        const thesis = allTheses.find(t => t.id == thesisId);
        let thesisInfoHtml = '';
        
        if (thesis) {
            thesisInfoHtml = `
                <strong>Θέμα:</strong> ${thesis.title}<br>
                <strong>Φοιτητής:</strong> ${thesis.student || 'Δεν είναι διαθέσιμο'}<br>
                <strong>ΑΜ:</strong> ${thesis.studentId || 'Δεν είναι διαθέσιμο'}
            `;
        }
        
        // Show custom confirmation modal
        showCustomConfirmation({
            title: 'Επιβεβαίωση Ακύρωσης Ανάθεσης',
            message: 'Είστε βέβαιοι ότι θέλετε να ακυρώσετε την ανάθεση αυτής της διπλωματικής;',
            icon: 'fas fa-exclamation-triangle',
            iconColor: 'text-danger',
            confirmText: 'Ακύρωση Ανάθεσης',
            confirmClass: 'btn-danger',
            cancelText: 'Πίσω',
            thesisInfo: thesisInfoHtml,
            onConfirm: () => {
                cancelThesisAssignment(thesisId);
            }
        });
    };

    // API call to cancel thesis assignment
    async function cancelThesisAssignment(thesisId) {
        try {
            showNotification('Ακύρωση ανάθεσης σε εξέλιξη...', 'info');
            
            const response = await fetch('/api/professor/cancel-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thesisId: thesisId })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification(result.message || 'Η ανάθεση ακυρώθηκε επιτυχώς!', 'success');
                
                // Reload the theses list to reflect changes with a small delay
                setTimeout(() => {
                    loadMyTheses();
                    
                    // Also refresh available topics since cancelled thesis becomes available again
                    loadAvailableTopics();
                    loadAvailableTopicsForDisplay();
                }, 1000);
            } else {
                throw new Error(result.message || 'Σφάλμα κατά την ακύρωση ανάθεσης');
            }
        } catch (error) {
            console.error('Error cancelling assignment:', error);
            showNotification('Σφάλμα: ' + error.message, 'error');
        }
    }

    // Cancel thesis assignment from details view
    window.cancelThesisAssignmentFromDetails = function(thesisId) {
        console.log('Cancel assignment from details for thesis:', thesisId);
        
        // Get thesis information from current data
        const currentThesis = window.currentThesisData;
        let thesisInfoHtml = '';
        
        if (currentThesis) {
            thesisInfoHtml = `
                <strong>Θέμα:</strong> ${currentThesis.title}<br>
                <strong>Φοιτητής:</strong> ${currentThesis.student_name || 'Δεν είναι διαθέσιμο'}<br>
                <strong>ΑΜ:</strong> ${currentThesis.student_number || 'Δεν είναι διαθέσιμο'}
            `;
        }
        
        // Show custom confirmation modal
        showCustomConfirmation({
            title: 'Επιβεβαίωση Ακύρωσης Ανάθεσης',
            message: 'Είστε βέβαιοι ότι θέλετε να ακυρώσετε την ανάθεση αυτής της διπλωματικής;',
            icon: 'fas fa-exclamation-triangle',
            iconColor: 'text-danger',
            confirmText: 'Ακύρωση Ανάθεσης',
            confirmClass: 'btn-danger',
            cancelText: 'Πίσω',
            thesisInfo: thesisInfoHtml,
            onConfirm: () => {
                cancelThesisAssignmentFromDetailsAPI(thesisId);
            }
        });
    };

    // API call to cancel thesis assignment from details view
    async function cancelThesisAssignmentFromDetailsAPI(thesisId) {
        try {
            showNotification('Ακύρωση ανάθεσης σε εξέλιξη...', 'info');
            
            const response = await fetch('/api/professor/cancel-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thesisId: thesisId })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification(result.message || 'Η ανάθεση ακυρώθηκε επιτυχώς!', 'success');
                
                // Close thesis details view and go back to list
                setTimeout(() => {
                    document.getElementById('thesisDetailsView').style.display = 'none';
                    document.getElementById('myThesesList').style.display = 'block';
                    
                    // Set "Οι Διπλωματικές Μου" as active
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                        if (navLink.getAttribute('data-section') === 'myThesesList') {
                            navLink.classList.add('active');
                        }
                    });
                    
                    // Reload the theses list to reflect changes
                    loadMyTheses();
                    
                    // Also refresh available topics since cancelled thesis becomes available again
                    loadAvailableTopics();
                    loadAvailableTopicsForDisplay();
                }, 1500);
            } else {
                throw new Error(result.message || 'Σφάλμα κατά την ακύρωση ανάθεσης');
            }
        } catch (error) {
            console.error('Error cancelling assignment from details:', error);
            showNotification('Σφάλμα: ' + error.message, 'error');
        }
    }

    // Cancel active thesis (after 2 years with assembly decision)
    window.cancelActiveThesis = function(thesisId) {
        console.log('Cancel active thesis for ID:', thesisId);
        
        // Get thesis information from current data
        const currentThesis = window.currentThesisData;
        
        if (!currentThesis) {
            showNotification('Σφάλμα: Δεν βρέθηκαν στοιχεία διπλωματικής', 'error');
            return;
        }
        
        // Check if thesis is eligible for cancellation
        if (!isThesisEligibleForCancellation(currentThesis)) {
            showNotification('Σφάλμα: Η διπλωματική δεν είναι επιλέξιμη για ακύρωση (δεν έχουν παρέλθει 2 έτη)', 'error');
            return;
        }
        
        // Populate thesis info in modal
        const thesisInfoContainer = document.getElementById('activeThesisInfo');
        if (thesisInfoContainer) {
            const assignmentDate = formatDate(currentThesis.assigned_at);
            const yearsElapsed = Math.floor((new Date() - new Date(currentThesis.assigned_at)) / (365 * 24 * 60 * 60 * 1000));
            
            thesisInfoContainer.innerHTML = `
                <h6 class="fw-bold text-bordeaux">${currentThesis.title}</h6>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Φοιτητής:</strong> ${currentThesis.student_name || 'Δεν είναι διαθέσιμο'}</p>
                        <p class="mb-2"><strong>ΑΜ:</strong> ${currentThesis.student_number || 'Δεν είναι διαθέσιμο'}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Ημ. Ανάθεσης:</strong> ${assignmentDate}</p>
                        <p class="mb-2"><strong>Έτη από ανάθεση:</strong> <span class="badge bg-success">${yearsElapsed} έτη</span></p>
                    </div>
                </div>
            `;
        }
        
        // Set current year as default
        const currentYear = new Date().getFullYear();
        const assemblyYearInput = document.getElementById('assemblyYear');
        if (assemblyYearInput) {
            assemblyYearInput.value = currentYear;
        }
        
        // Clear assembly number
        const assemblyNumberInput = document.getElementById('assemblyNumber');
        if (assemblyNumberInput) {
            assemblyNumberInput.value = '';
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cancelActiveThesisModal'));
        modal.show();
        
        // Handle confirmation
        const confirmBtn = document.getElementById('confirmCancelActiveThesis');
        const handleConfirm = function() {
            const assemblyNumber = document.getElementById('assemblyNumber').value;
            const assemblyYear = document.getElementById('assemblyYear').value;
            
            if (!assemblyNumber || !assemblyYear) {
                showNotification('Παρακαλώ συμπληρώστε τον αριθμό και το έτος της Γενικής Συνέλευσης', 'error');
                return;
            }
            
            cancelActiveThesisAPI(thesisId, assemblyNumber, assemblyYear);
            confirmBtn.removeEventListener('click', handleConfirm);
            modal.hide();
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
    };

    // API call to cancel active thesis
    async function cancelActiveThesisAPI(thesisId, assemblyNumber, assemblyYear) {
        try {
            showNotification('Ακύρωση ενεργής διπλωματικής σε εξέλιξη...', 'info');
            
            const response = await fetch('/api/professor/cancel-active-thesis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    thesisId: thesisId,
                    assemblyNumber: assemblyNumber,
                    assemblyYear: assemblyYear,
                    reason: 'από Διδάσκοντα'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Η ενεργή διπλωματική ακυρώθηκε επιτυχώς!', 'success');
                
                // Go back to thesis list after successful cancellation
                setTimeout(() => {
                    document.getElementById('thesisDetailsView').style.display = 'none';
                    document.getElementById('myThesesList').style.display = 'block';
                    
                    // Set "Οι Διπλωματικές Μου" as active
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                        if (navLink.getAttribute('data-section') === 'myThesesList') {
                            navLink.classList.add('active');
                        }
                    });
                    
                    // Reload the theses list to reflect changes
                    loadMyTheses();
                }, 1500);
            } else {
                throw new Error(result.message || 'Σφάλμα κατά την ακύρωση της ενεργής διπλωματικής');
            }
        } catch (error) {
            console.error('Error cancelling active thesis:', error);
            showNotification('Σφάλμα: ' + error.message, 'error');
        }
    }

    // Back to list button handler
    function setupThesisDetailsHandlers() {
        const backBtn = document.getElementById('backToThesesList');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                document.getElementById('thesisDetailsView').style.display = 'none';
                document.getElementById('myThesesList').style.display = 'block';
                
                // Set "Οι Διπλωματικές Μου" as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                const myThesesLink = document.getElementById('myThesesLink');
                if (myThesesLink) {
                    myThesesLink.classList.add('active');
                }
            });
        }
    }

    // Toggle edit mode
    window.toggleEditMode = function() {
        const editForm = document.getElementById('editThesisForm');
        if (editForm.style.display === 'none' || !editForm.style.display) {
            editForm.style.display = 'block';
            // Populate edit form with current values
            populateEditForm();
            showNotification('Λειτουργία επεξεργασίας ενεργοποιήθηκε', 'info');
            
            // Scroll to the edit form
            editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            editForm.style.display = 'none';
            showNotification('Λειτουργία επεξεργασίας απενεργοποιήθηκε', 'info');
        }
    };

    function populateEditForm() {
        try {
            // Use only authentic data from the API
            if (window.currentThesisData) {
                const thesis = window.currentThesisData;
                
                document.getElementById('editTitle').value = thesis.title || '';
                document.getElementById('editDescription').value = thesis.description || '';
                document.getElementById('editStatus').value = thesis.status || '';
                
                console.log('Edit form populated with authentic data:', {
                    title: thesis.title,
                    description: thesis.description,
                    status: thesis.status
                });
            } else {
                console.error('No authentic thesis data available for edit form');
                showNotification('Σφάλμα: Δεν είναι διαθέσιμα τα δεδομένα της διπλωματικής', 'error');
            }
        } catch (error) {
            console.error('Error populating edit form:', error);
            showNotification('Σφάλμα κατά τη φόρτωση των στοιχείων επεξεργασίας', 'error');
        }
    }

    // Export PDF functionality
    window.exportThesisPDF = async function(thesisId) {
        console.log('Export PDF for thesis:', thesisId);
        
        try {
            showNotification('Προετοιμασία εξαγωγής PDF...', 'info');
            
            // Get current thesis data
            const response = await fetch('/api/professor/thesis-details/' + thesisId);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Αποτυχία λήψης δεδομένων');
            }
            
            const thesis = result.data;
            generateThesisPDF(thesis);
            
            showNotification('Το PDF εξήχθη επιτυχώς!', 'success');
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showNotification('Σφάλμα κατά την εξαγωγή PDF: ' + error.message, 'error');
        }
    };
    
    function generateThesisPDF(thesis) {
        // Create a new window with the thesis report
        const printWindow = window.open('', '_blank');
        
        const pdfContent = generatePDFContent(thesis);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Αναφορά Διπλωματικής - ${thesis.title}</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #7d1935; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px; 
                    }
                    .header h1 { 
                        color: #7d1935; 
                        margin: 0; 
                        font-size: 24px;
                    }
                    .section { 
                        margin-bottom: 25px; 
                    }
                    .section h2 { 
                        color: #7d1935; 
                        border-bottom: 1px solid #ddd; 
                        padding-bottom: 5px; 
                        font-size: 18px;
                    }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: 200px 1fr; 
                        gap: 10px; 
                        margin-bottom: 15px; 
                    }
                    .label { 
                        font-weight: bold; 
                        color: #555; 
                    }
                    .timeline-item { 
                        border-left: 3px solid #7d1935; 
                        padding-left: 15px; 
                        margin-bottom: 15px; 
                    }
                    .committee-member { 
                        background: #f8f9fa; 
                        padding: 10px; 
                        margin-bottom: 10px; 
                        border-radius: 5px; 
                    }
                    .file-item { 
                        background: #f1f3f4; 
                        padding: 8px 12px; 
                        margin-bottom: 8px; 
                        border-radius: 3px; 
                    }
                    .comment { 
                        background: #fff3cd; 
                        border: 1px solid #ffeaa7; 
                        padding: 12px; 
                        margin-bottom: 10px; 
                        border-radius: 5px; 
                    }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${pdfContent}
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #7d1935; color: white; border: none; border-radius: 5px; cursor: pointer;">Εκτύπωση / Αποθήκευση ως PDF</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Κλείσιμο</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    function generatePDFContent(thesis) {
        let content = `
            <div class="header">
                <h1>Αναφορά Διπλωματικής Εργασίας</h1>
                <p>Σύστημα Διαχείρισης Διπλωματικών Εργασιών</p>
                <p>Ημερομηνία εξαγωγής: ${formatDate(new Date())}</p>
            </div>
            
            <div class="section">
                <h2>Βασικά Στοιχεία</h2>
                <div class="info-grid">
                    <div class="label">Κωδικός:</div>
                    <div>${thesis.code}</div>
                    <div class="label">Τίτλος:</div>
                    <div>${thesis.title}</div>
                    <div class="label">Περιγραφή:</div>
                    <div>${thesis.description}</div>
                    <div class="label">Κατάσταση:</div>
                    <div>${thesis.status}</div>
                    <div class="label">Ημ. Δημιουργίας:</div>
                    <div>${formatDate(thesis.created_at)}</div>
                    <div class="label">Ημ. Ανάθεσης:</div>
                    <div>${thesis.assigned_at ? formatDate(thesis.assigned_at) : 'Μη ανατεθειμένη'}</div>
                    <div class="label">Διάρκεια:</div>
                    <div>${thesis.duration ? thesis.duration + ' ημέρες' : 'Δεν υπολογίζεται'}</div>
                </div>
            </div>
        `;
        
        // Student information
        if (thesis.student_name) {
            content += `
                <div class="section">
                    <h2>Στοιχεία Φοιτητή</h2>
                    <div class="info-grid">
                        <div class="label">Όνομα:</div>
                        <div>${thesis.student_name}</div>
                        <div class="label">Αρ. Μητρώου:</div>
                        <div>${thesis.student_number || 'Δεν διατίθεται'}</div>
                        <div class="label">Email:</div>
                        <div>${thesis.student_email || 'Δεν διατίθεται'}</div>
                        <div class="label">Τηλέφωνο:</div>
                        <div>${thesis.student_phone || 'Δεν διατίθεται'}</div>
                    </div>
                </div>
            `;
        }
        
        // Committee information
        if (thesis.committee && thesis.committee.length > 0) {
            content += `
                <div class="section">
                    <h2>Εξεταστική Επιτροπή</h2>
            `;
            thesis.committee.forEach(member => {
                content += `
                    <div class="committee-member">
                        <strong>${getRoleText(member.role)}:</strong> ${member.professor_name}<br>
                        <small>Email: ${member.email}</small>
                    </div>
                `;
            });
            content += `</div>`;
        }
        
        // Timeline
        if (thesis.events && thesis.events.length > 0) {
            content += `
                <div class="section">
                    <h2>Χρονολόγιο Γεγονότων</h2>
            `;
            thesis.events.forEach(event => {
                content += `
                    <div class="timeline-item">
                        <strong>${event.event_type}</strong> - ${formatDate(event.event_date)}<br>
                        <small>${event.description}</small>
                    </div>
                `;
            });
            content += `</div>`;
        }
        
        // Files
        if (thesis.files && thesis.files.length > 0) {
            content += `
                <div class="section">
                    <h2>Συνημμένα Αρχεία</h2>
            `;
            thesis.files.forEach(file => {
                content += `
                    <div class="file-item">
                        <strong>${file.original_name}</strong><br>
                        <small>Τύπος: ${file.file_type} | Ημερομηνία: ${formatDate(file.uploaded_at)}</small>
                    </div>
                `;
            });
            content += `</div>`;
        }
        
        // Comments
        if (thesis.comments && thesis.comments.length > 0) {
            content += `
                <div class="section">
                    <h2>Σχόλια Επιτροπής</h2>
            `;
            thesis.comments.forEach(comment => {
                content += `
                    <div class="comment">
                        <strong>${comment.author_name}</strong> - ${formatDate(comment.created_at)}<br>
                        ${comment.grade ? `<strong>Βαθμός:</strong> ${comment.grade}<br>` : ''}
                        <p>${comment.comment}</p>
                    </div>
                `;
            });
            content += `</div>`;
        }
        
        return content;
    }

    // Edit form handlers
    function setupEditFormHandlers() {
        const cancelBtn = document.getElementById('cancelEditBtn');
        const saveAndReturnBtn = document.getElementById('saveAndReturnBtn');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.getElementById('editThesisForm').style.display = 'none';
            });
        }
        
        if (saveAndReturnBtn) {
            saveAndReturnBtn.addEventListener('click', async function() {
                await saveThesisChanges(); // Always save and return to list
            });
        }
    }

    async function saveThesisChanges() {
        const thesisId = getCurrentThesisId();
        if (!thesisId) {
            showNotification('Σφάλμα: Δεν βρέθηκε το ID της διπλωματικής', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', document.getElementById('editTitle').value);
        formData.append('description', document.getElementById('editDescription').value);
        formData.append('status', document.getElementById('editStatus').value);
        
        // Add PDF file if uploaded
        const pdfFile = document.getElementById('editPdf').files[0];
        if (pdfFile) {
            formData.append('pdf', pdfFile);
        }
        
        try {
            showNotification('Αποθήκευση αλλαγών...', 'info');
            
            const response = await fetch('/api/professor/update-thesis/' + thesisId, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Οι αλλαγές αποθηκεύτηκαν επιτυχώς!', 'success');
                
                // Hide edit form
                document.getElementById('editThesisForm').style.display = 'none';
                
                // Return to list after save with a short delay to show success message
                setTimeout(() => {
                    returnToThesesList();
                }, 1500);
            } else {
                showNotification('Σφάλμα: ' + (result.message || 'Αποτυχία αποθήκευσης'), 'error');
            }
        } catch (error) {
            console.error('Error saving thesis changes:', error);
            showNotification('Σφάλμα δικτύου κατά την αποθήκευση', 'error');
        }
    }
    
    function getCurrentThesisId() {
        // Get thesis ID from the stored authentic data
        if (window.currentThesisData && window.currentThesisData.id) {
            return window.currentThesisData.id.toString();
        }
        
        console.warn('No authentic thesis data available for getting thesis ID');
        return null;
    }    
    // Return to theses list
    function returnToThesesList() {
        document.getElementById('thesisDetailsView').style.display = 'none';
        document.getElementById('myThesesList').style.display = 'block';
        
        // Set "Οι Διπλωματικές Μου" as active
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        const myThesesLink = document.getElementById('myThesesLink');
        if (myThesesLink) {
            myThesesLink.classList.add('active');
        }
        
        // Refresh the list to show updated data
        loadMyTheses();
    }

    // Initialize all event handlers
    function initializeThesisDetailsHandlers() {
        setupThesisDetailsHandlers();
        setupEditFormHandlers();
    }

    // Call initialization
    initializeThesisDetailsHandlers();
    
    // ===== GRADING FUNCTIONALITY =====
    
    // Open grading modal for thesis under examination
    window.openGradingModal = function(thesisId) {
        console.log('Opening grading modal for thesis:', thesisId);
        
        // Create grading modal if it doesn't exist
        createGradingModal();
        
        // Set thesis ID in modal
        document.getElementById('gradingThesisId').value = thesisId;
        
        // Reset form
        document.getElementById('gradingForm').reset();
        document.getElementById('gradingError').style.display = 'none';
        
        // Load existing grades for this thesis
        loadThesisGrades(thesisId);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('gradingModal'));
        modal.show();
    };
    
    // Create grading modal dynamically
    function createGradingModal() {
        // Check if modal already exists
        if (document.getElementById('gradingModal')) {
            return;
        }
        
        const modalHTML = `
            <div class="modal fade" id="gradingModal" tabindex="-1" aria-labelledby="gradingModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: #6A1F2B; color: white;">
                            <h5 class="modal-title" id="gradingModalLabel" style="background-color: transparent; color: white;">
                                <i class="fas fa-star me-2"></i>Τελική Βαθμολογία
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Περιοχή για εμφάνιση υπαρχόντων βαθμολογιών -->
                            <div id="existingGradesSection" class="mb-4" style="display: none;">
                                <h6 class="fw-semibold mb-3">
                                    <i class="fas fa-list me-2" style="color: #6A1F2B;"></i>Υποβληθείσες Βαθμολογίες
                                </h6>
                                <div id="existingGradesList" class="border rounded p-3" style="background-color: #f8f9fa;">
                                    <!-- Grades will be loaded here -->
                                </div>
                            </div>

                            <form id="gradingForm">
                                <input type="hidden" id="gradingThesisId" name="thesis_id">
                                
                                <h6 class="fw-semibold mb-3">
                                    <i class="fas fa-plus me-2" style="color: #6A1F2B;"></i>Υποβολή Βαθμολογίας
                                </h6>
                                
                                <div class="row">
                                    <div class="col-md-12 mb-3">
                                        <label for="gradingScore" class="form-label fw-semibold">
                                            <i class="fas fa-calculator me-2" style="color: #6A1F2B;"></i>Βαθμός (0-10)
                                        </label>
                                        <input type="number" id="gradingScore" name="grade" class="form-control" 
                                               min="0" max="10" step="0.1" placeholder="π.χ. 8.5" required>
                                        <div class="form-text">Εισάγετε βαθμό από 0 έως 10 με δεκαδικά</div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="gradingComments" class="form-label fw-semibold">
                                        <i class="fas fa-comment me-2" style="color: #6A1F2B;"></i>Σχόλια Αξιολόγησης
                                    </label>
                                    <textarea id="gradingComments" name="comment" class="form-control" rows="4" 
                                              placeholder="Εισάγετε τα σχόλιά σας για την αξιολόγηση της διπλωματικής..."></textarea>
                                    <div class="form-text">Προαιρετικά σχόλια για τη βαθμολόγηση</div>
                                </div>
                                
                                <div id="gradingError" class="alert alert-danger" style="display: none;">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    <span id="gradingErrorText"></span>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Ακύρωση
                            </button>
                            <button type="button" class="btn" style="background-color: #6A1F2B; color: white;" onclick="submitGrading()" id="submitGradingBtn">
                                <i class="fas fa-save me-2"></i>Αποθήκευση Βαθμολόγησης
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Submit grading
    window.submitGrading = async function() {
        const form = document.getElementById('gradingForm');
        const submitBtn = document.getElementById('submitGradingBtn');
        const errorDiv = document.getElementById('gradingError');
        const errorText = document.getElementById('gradingErrorText');
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const gradingData = {
            thesis_id: parseInt(formData.get('thesis_id')),
            grade: parseFloat(formData.get('grade')),
            comment_type: formData.get('comment_type'),
            title: formData.get('title'),
            comment: formData.get('comment')
        };
        
        // Validate grade range
        if (gradingData.grade < 0 || gradingData.grade > 10) {
            showGradingError('Ο βαθμός πρέπει να είναι μεταξύ 0 και 10');
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Αποθήκευση...';
        submitBtn.disabled = true;
        errorDiv.style.display = 'none';
        
        try {
            const response = await fetch('/submit-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    thesis_id: gradingData.thesis_id,
                    grade: gradingData.grade,
                    comment: gradingData.comment
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                let message = 'Η βαθμολόγηση αποθηκεύτηκε επιτυχώς!';
                
                // Προσθήκη πληροφοριών για τον τελικό βαθμό
                if (result.allGradesSubmitted && result.finalGrade) {
                    message += ` Η διπλωματική ολοκληρώθηκε με τελικό βαθμό: ${result.finalGrade}`;
                } else {
                    message += ` Υποβληθεί ${result.totalGrades}/3 βαθμολογίες.`;
                }
                
                showNotification(message, 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('gradingModal'));
                modal.hide();
                
                // Refresh thesis list to show updated status
                loadMyTheses();
                
            } else {
                throw new Error(result.error || 'Σφάλμα κατά την αποθήκευση της βαθμολόγησης');
            }
            
        } catch (error) {
            console.error('Error submitting grading:', error);
            showGradingError(error.message || 'Σφάλμα κατά την αποθήκευση της βαθμολόγησης');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };
    
    // Show grading error
    function showGradingError(message) {
        const errorDiv = document.getElementById('gradingError');
        const errorText = document.getElementById('gradingErrorText');
        
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Load existing grades for a thesis
    async function loadThesisGrades(thesisId) {
        try {
            const response = await fetch(`/thesis/${thesisId}/grades`);
            const result = await response.json();
            
            if (response.ok && result.success) {
                displayExistingGrades(result);
            } else {
                console.warn('Could not load grades:', result.error);
                // Hide the existing grades section if there's an error
                document.getElementById('existingGradesSection').style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading thesis grades:', error);
            document.getElementById('existingGradesSection').style.display = 'none';
        }
    }
    
    // Display existing grades in the modal
    function displayExistingGrades(gradeData) {
        const existingGradesSection = document.getElementById('existingGradesSection');
        const existingGradesList = document.getElementById('existingGradesList');
        
        if (!gradeData.submitted_grades || gradeData.submitted_grades.length === 0) {
            existingGradesSection.style.display = 'none';
            return;
        }
        
        let gradesHTML = '';
        
        // Show progress info
        gradesHTML += `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Πρόοδος βαθμολόγησης:</strong> ${gradeData.total_submitted}/3 βαθμολογίες υποβληθεί
                ${gradeData.final_grade ? `<br><strong>Τελικός Βαθμός:</strong> ${gradeData.final_grade}` : ''}
            </div>
        `;
        
        // Show committee members and their grades
        gradeData.committee_members.forEach(member => {
            const memberGrade = gradeData.submitted_grades.find(grade => grade.professor_id === member.professor_id);
            
            gradesHTML += `
                <div class="row mb-2 p-2 border rounded">
                    <div class="col-md-4">
                        <strong>${member.name} ${member.surname}</strong><br>
                        <small class="text-muted">${member.role}</small>
                    </div>
                    <div class="col-md-3">
                        ${memberGrade ? 
                            `<span class="badge bg-success">Βαθμός: ${memberGrade.grade}</span>` : 
                            `<span class="badge bg-warning">Εκκρεμεί</span>`
                        }
                    </div>
                    <div class="col-md-5">
                        ${memberGrade && memberGrade.comment ? 
                            `<small class="text-muted">${memberGrade.comment}</small>` : 
                            `<small class="text-muted">Χωρίς σχόλια</small>`
                        }
                    </div>
                </div>
            `;
        });
        
        existingGradesList.innerHTML = gradesHTML;
        existingGradesSection.style.display = 'block';
    }
    
    // Test function for debugging
    window.testViewThesisDetails = function() {
        console.log('Testing viewThesisDetails function...');
        console.log('Available elements:');
        console.log('- myThesesList:', document.getElementById('myThesesList'));
        console.log('- thesisDetailsView:', document.getElementById('thesisDetailsView'));
        
        // Test with thesis ID 1
        viewThesisDetails(1);
    };
    
    // Debug function to check if all required elements exist
    window.debugElements = function() {
        const elements = [
            'myThesesList',
            'thesisDetailsView',
            'thesisDetailsLoading',
            'thesisDetailsContent',
            'backToThesesList'
        ];
        
        console.log('Element check:');
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? 'Found' : 'NOT FOUND');
        });
    };
    
    // Export theses to CSV
    function exportThesesToCsv() {
        try {
            showNotification('Προετοιμασία εξαγωγής CSV...', 'info');
            
            // Get currently filtered theses
            let thesesToExport = allTheses;
            
            // Apply current filters to get the same data as displayed
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter && statusFilter.value) {
                const statusMapping = {
                    'unassigned': 'Χωρίς Ανάθεση',
                    'under_assignment': 'Υπό Ανάθεση',
                    'active': 'Ενεργή',
                    'under_examination': 'Υπό Εξέταση',
                    'completed': 'Περατωμένη',
                    'cancelled': 'Ακυρωμένη'
                };
                
                const targetStatus = statusMapping[statusFilter.value];
                if (targetStatus) {
                    thesesToExport = thesesToExport.filter(thesis => 
                        thesis.status === targetStatus
                    );
                }
            }
            
            const roleFilter = document.getElementById('roleFilter');
            if (roleFilter && roleFilter.value) {
                thesesToExport = thesesToExport.filter(thesis => 
                    thesis.role === roleFilter.value
                );
            }
            
            const searchInput = document.getElementById('thesesSearch');
            if (searchInput && searchInput.value.trim()) {
                const searchTerm = searchInput.value.trim().toLowerCase();
                thesesToExport = thesesToExport.filter(thesis => 
                    (thesis.title && thesis.title.toLowerCase().includes(searchTerm)) ||
                    (thesis.student && thesis.student.toLowerCase().includes(searchTerm)) ||
                    (thesis.studentId && thesis.studentId.toString().includes(searchTerm))
                );
            }
            
            if (!thesesToExport || thesesToExport.length === 0) {
                showNotification('Δεν υπάρχουν δεδομένα για εξαγωγή με τα τρέχοντα φίλτρα', 'warning');
                return;
            }
            
            // Generate CSV content
            const csvContent = generateCsvContent(thesesToExport);
            
            // Create and download CSV file
            downloadCsvFile(csvContent, `διπλωματικες_${formatDateForFilename(new Date())}.csv`);
            
            showNotification(`Εξάχθηκαν ${thesesToExport.length} διπλωματικές σε CSV επιτυχώς!`, 'success');
            
        } catch (error) {
            console.error('Error exporting CSV:', error);
            showNotification('Σφάλμα κατά την εξαγωγή CSV: ' + error.message, 'error');
        }
    }

    // Export theses to JSON
    function exportThesesToJson() {
        try {
            showNotification('Προετοιμασία εξαγωγής JSON...', 'info');
            
            // Get currently filtered theses
            let thesesToExport = allTheses;
            
            // Apply current filters to get the same data as displayed
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter && statusFilter.value) {
                const statusMapping = {
                    'unassigned': 'Χωρίς Ανάθεση',
                    'under_assignment': 'Υπό Ανάθεση',
                    'active': 'Ενεργή',
                    'under_examination': 'Υπό Εξέταση',
                    'completed': 'Περατωμένη',
                    'cancelled': 'Ακυρωμένη'
                };
                
                const targetStatus = statusMapping[statusFilter.value];
                if (targetStatus) {
                    thesesToExport = thesesToExport.filter(thesis => 
                        thesis.status === targetStatus
                    );
                }
            }
            
            const roleFilter = document.getElementById('roleFilter');
            if (roleFilter && roleFilter.value) {
                thesesToExport = thesesToExport.filter(thesis => 
                    thesis.role === roleFilter.value
                );
            }
            
            const searchInput = document.getElementById('thesesSearch');
            if (searchInput && searchInput.value.trim()) {
                const searchTerm = searchInput.value.trim().toLowerCase();
                thesesToExport = thesesToExport.filter(thesis => 
                    (thesis.title && thesis.title.toLowerCase().includes(searchTerm)) ||
                    (thesis.student && thesis.student.toLowerCase().includes(searchTerm)) ||
                    (thesis.studentId && thesis.studentId.toString().includes(searchTerm))
                );
            }
            
            if (!thesesToExport || thesesToExport.length === 0) {
                showNotification('Δεν υπάρχουν δεδομένα για εξαγωγή με τα τρέχοντα φίλτρα', 'warning');
                return;
            }
            
            // Generate JSON content
            const jsonContent = generateJsonContent(thesesToExport);
            
            // Create and download JSON file
            downloadJsonFile(jsonContent, `διπλωματικες_${formatDateForFilename(new Date())}.json`);
            
            showNotification(`Εξάχθηκαν ${thesesToExport.length} διπλωματικές σε JSON επιτυχώς!`, 'success');
            
        } catch (error) {
            console.error('Error exporting JSON:', error);
            showNotification('Σφάλμα κατά την εξαγωγή JSON: ' + error.message, 'error');
        }
    }
    
    // Generate CSV content from theses array
    function generateCsvContent(theses) {
        // Define CSV headers (in Greek)
        const headers = [
            'ID',
            'Τίτλος',
            'Κατάσταση',
            'Ρόλος Μου',
            'Φοιτητής',
            'Αριθμός Μητρώου',
            'Ημερομηνία Ανάθεσης',
            'Διάρκεια (ημέρες)',
            'Ημερομηνία Δημιουργίας'
        ];
        
        // Create CSV rows
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.map(header => escapeCsvField(header)).join(','));
        
        // Add data rows
        theses.forEach(thesis => {
            const row = [
                thesis.id || '',
                thesis.title || '',
                thesis.status || '',
                getRoleText(thesis.role) || '',
                thesis.student || 'Μη ανατεθειμένη',
                thesis.studentId || thesis.student_number || '',
                thesis.assignDate ? formatDateForCsv(thesis.assignDate) : (thesis.assigned_at ? formatDateForCsv(thesis.assigned_at) : ''),
                thesis.duration || '',
                thesis.created_at ? formatDateForCsv(thesis.created_at) : (thesis.createdAt ? formatDateForCsv(thesis.createdAt) : '')
            ];
            
            csvRows.push(row.map(field => escapeCsvField(field.toString())).join(','));
        });
        
        return csvRows.join('\n');
    }
    
    // Escape CSV field (handle commas, quotes, newlines)
    function escapeCsvField(field) {
        if (field == null) return '';
        
        // Convert to string and handle special characters
        const stringField = field.toString();
        
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
            return '"' + stringField.replace(/"/g, '""') + '"';
        }
        
        return stringField;
    }
    
    // Format date for CSV (YYYY-MM-DD)
    function formatDateForCsv(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch (error) {
            return dateString; // Return original if parsing fails
        }
    }
    
    // Format date for filename (YYYY-MM-DD_HH-MM)
    function formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}_${hours}-${minutes}`;
    }
    
    // Download CSV file
    function downloadCsvFile(csvContent, filename) {
        // Add BOM for proper UTF-8 encoding in Excel
        const bom = '\uFEFF';
        const csvData = bom + csvContent;
        
        // Create blob and download link
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            // Create download link
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            // Add to document and trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL
            URL.revokeObjectURL(url);
        } else {
            // Fallback for older browsers
            const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
            window.open(url);
        }
    }

    // Generate JSON content from theses array
    function generateJsonContent(theses) {
        // Create a structured JSON object with metadata and data
        const exportData = {
            exportInfo: {
                exportDate: new Date().toISOString(),
                exportFormat: 'JSON',
                totalRecords: theses.length,
                exportedBy: 'Professor Dashboard',
                systemName: 'Thesis Management System'
            },
            filters: {
                status: document.getElementById('statusFilter')?.value || 'all',
                role: document.getElementById('roleFilter')?.value || 'all',
                search: document.getElementById('thesesSearch')?.value || ''
            },
            theses: theses.map(thesis => ({
                id: thesis.id || null,
                title: thesis.title || '',
                status: thesis.status || '',
                role: getRoleText(thesis.role) || '',
                student: {
                    name: thesis.student || 'Μη ανατεθειμένη',
                    studentId: thesis.studentId || thesis.student_number || null
                },
                dates: {
                    assignDate: thesis.assignDate || thesis.assigned_at || null,
                    createdAt: thesis.created_at || thesis.createdAt || null
                },
                duration: thesis.duration || 0,
                pdfFile: thesis.pdfFile || null
            }))
        };
        
        return JSON.stringify(exportData, null, 2); // Pretty formatted JSON
    }

    // Download JSON file
    function downloadJsonFile(jsonContent, filename) {
        // Create blob and download link
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            // Create download link
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            // Add to document and trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL
            URL.revokeObjectURL(url);
        } else {
            // Fallback for older browsers
            const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
            window.open(url);
        }
    }
    
    // Test function for debugging
    window.testViewThesisDetails = function() {
        console.log('Testing viewThesisDetails function...');
        console.log('Available elements:');
        console.log('- myThesesList:', document.getElementById('myThesesList'));
        console.log('- thesisDetailsView:', document.getElementById('thesisDetailsView'));
        
        // Test with thesis ID 1
        viewThesisDetails(1);
    };
    
    // Test function for CSV export (for debugging)
    window.testCsvExport = function() {
        console.log('Testing CSV export...');
        console.log('allTheses:', allTheses);
        
        if (allTheses && allTheses.length > 0) {
            console.log('Sample thesis data:', allTheses[0]);
            exportThesesToCsv();
        } else {
            console.log('No theses data available for testing');
        }
    };

    // ===== UC12: STATISTICS FUNCTIONALITY =====
    function initializeStatistics() {
        console.log('Initializing statistics...'); // Debug log
        const statisticsSection = document.getElementById('statisticsSection');
        const backToMainFromStats = document.getElementById('backToMainFromStats');
        const retryStatsBtn = document.getElementById('retryStatsBtn');
        
        console.log('Statistics section element:', statisticsSection); // Debug log
        
        // Back to main button
        if (backToMainFromStats) {
            backToMainFromStats.addEventListener('click', function(e) {
                e.preventDefault();
                showStatisticsAsHomePage();
                
                // Set home as active
                const homeLink = document.querySelector('.nav-link:not([id])');
                if (homeLink && homeLink.textContent.includes('Αρχική')) {
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    homeLink.classList.add('active');
                }
            });
        }
        
        // Retry button
        if (retryStatsBtn) {
            retryStatsBtn.addEventListener('click', function() {
                loadStatisticsData();
            });
        }
    }
    
    function showStatisticsSection() {
        console.log('showStatisticsSection called'); // Debug log
        hideAllForms();
        updateMainTitle('Στατιστικά Εποπτείας');
        
        const statisticsSection = document.getElementById('statisticsSection');
        console.log('Statistics section element:', statisticsSection); // Debug log
        if (statisticsSection) {
            statisticsSection.style.display = 'block';
            console.log('Statistics section displayed'); // Debug log
            
            // Scroll to the statistics section smoothly
            statisticsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            loadStatisticsData();
        } else {
            console.error('Statistics section not found!'); // Debug log
        }
    }
    
    // Function to show statistics as the home page
    function showStatisticsAsHomePage() {
        console.log('showStatisticsAsHomePage called');
        hideAllForms();
        updateMainTitle('Πίνακας Ελέγχου Καθηγητή - Στατιστικά');
        
        const statisticsSection = document.getElementById('statisticsSection');
        if (statisticsSection) {
            statisticsSection.style.display = 'block';
            loadStatisticsData();
        } else {
            console.error('Statistics section not found!');
        }
    }
    
    let statusChart, monthlyChart; // Global chart variables
    
    function loadStatisticsData() {
        console.log('loadStatisticsData called');
        const loadingDiv = document.getElementById('statisticsLoading');
        const contentDiv = document.getElementById('statisticsContent');
        const errorDiv = document.getElementById('statisticsError');
        
        // Show loading state
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (contentDiv) contentDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
        
        console.log('Starting fetch request...');
        fetch('/api/professor/statistics')
            .then(response => {
                console.log('Response received:', response);
                return response.json();
            })
            .then(data => {
                console.log('Data received:', data);
                if (data.success) {
                    populateStatistics(data.data);
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    if (contentDiv) contentDiv.style.display = 'block';
                } else {
                    throw new Error(data.message || 'Σφάλμα φόρτωσης στατιστικών');
                }
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'block';
                showNotification('Σφάλμα φόρτωσης στατιστικών: ' + error.message, 'error');
            });
    }
    
    function populateStatistics(stats) {
        console.log('populateStatistics called with:', stats);
        // Update overview cards
        updateElement('totalThesesCount', stats.overview.totalTheses);
        updateElement('completedThesesCount', stats.overview.statusDistribution.completed || 0);
        updateElement('activeThesesCount', stats.overview.statusDistribution.active || 0);
        updateElement('totalStudentsCount', stats.students.totalStudents);
        
        // Fix ID mismatch - use correct IDs from HTML
        updateElement('totalTopicsCount', stats.overview.totalTheses);
        updateElement('completedTopicsCount', stats.overview.statusDistribution.completed || 0);
        updateElement('activeTopicsCount', stats.overview.statusDistribution.active || 0);
        
        console.log('Overview cards updated');
        
        // Update performance metrics
        const avgMonths = stats.performance.averageCompletionMonths;
        updateElement('avgCompletionTime', avgMonths > 0 ? `${avgMonths} μήνες` : '-');
        updateElement('successRate', stats.performance.successRate > 0 ? `${stats.performance.successRate}%` : '-');
        updateElement('supervisorCount', stats.overview.roleDistribution.supervisor || 0);
        updateElement('committeeCount', stats.overview.roleDistribution.committee_member || 0);
        updateElement('activeSupervisionsCount', stats.overview.statusDistribution.active || 0);
        
        // Calculate and update completion rate
        const totalTheses = stats.overview.totalTheses;
        const completedTheses = stats.overview.statusDistribution.completed || 0;
        const completionRate = totalTheses > 0 ? Math.round((completedTheses / totalTheses) * 100) : 0;
        updateElement('completionRate', `${completionRate}%`);
        
        console.log('Performance metrics updated');
        
        // Update progress bars
        const completionProgress = document.getElementById('completionProgress');
        const successProgress = document.getElementById('successProgress');
        
        if (completionProgress) {
            completionProgress.style.width = `${completionRate}%`;
            completionProgress.setAttribute('aria-valuenow', completionRate);
        }
        
        if (successProgress && stats.performance.successRate > 0) {
            successProgress.style.width = `${stats.performance.successRate}%`;
            successProgress.setAttribute('aria-valuenow', stats.performance.successRate);
        }
        
        console.log('Progress bars updated');
        
        // Create charts
        console.log('Creating charts with data:', stats);
        createStatusChart(stats.overview.statusDistribution);
        createMonthlyChart(stats.trends.monthlyCreation);
        
        // Update recent activity
        console.log('Updating recent activity');
        updateRecentActivity(stats.recentActivity);
        
        console.log('Statistics population completed');
    }
    
    function updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    function createStatusChart(statusData) {
        console.log('createStatusChart called with:', statusData);
        const canvas = document.getElementById('statusChart');
        if (!canvas) {
            console.log('Canvas not found');
            return;
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded, showing fallback');
            // Show fallback content with actual data
            const container = canvas.parentElement;
            let fallbackHTML = '<div class="chart-fallback text-start"><h6 class="mb-3">Κατανομή Καταστάσεων:</h6><ul class="list-unstyled">';
            
            const statusLabels = {
                'unassigned': 'Χωρίς Ανάθεση',
                'under_assignment': 'Υπό Ανάθεση',
                'active': 'Ενεργές',
                'under_examination': 'Υπό Εξέταση',
                'completed': 'Ολοκληρωμένες',
                'cancelled': 'Ακυρωμένες'
            };
            
            Object.keys(statusData).forEach(status => {
                if (statusData[status] > 0) {
                    const label = statusLabels[status] || status;
                    fallbackHTML += `<li class="mb-2"><strong>${label}:</strong> ${statusData[status]}</li>`;
                }
            });
            
            fallbackHTML += '</ul></div>';
            container.innerHTML = fallbackHTML;
            return;
        }
        
        console.log('Chart.js is available, creating chart...');
        
        // Destroy existing chart
        if (statusChart) {
            statusChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Prepare data with Greek labels
        const statusLabels = {
            'unassigned': 'Χωρίς Ανάθεση',
            'under_assignment': 'Υπό Ανάθεση',
            'active': 'Ενεργές',
            'under_examination': 'Υπό Εξέταση',
            'completed': 'Ολοκληρωμένες',
            'cancelled': 'Ακυρωμένες'
        };
        
        const statusColors = {
            'unassigned': '#6c757d',
            'under_assignment': '#ffc107',
            'active': '#0d6efd',
            'under_examination': '#fd7e14',
            'completed': '#198754',
            'cancelled': '#dc3545'
        };
        
        const labels = [];
        const data = [];
        const colors = [];
        
        Object.keys(statusData).forEach(status => {
            if (statusData[status] > 0) {
                labels.push(statusLabels[status] || status);
                data.push(statusData[status]);
                colors.push(statusColors[status] || '#6c757d');
            }
        });
        
        console.log('Chart data prepared:', { labels, data, colors });
        
        try {
            statusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed * 100) / total).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('Status chart created successfully');
        } catch (error) {
            console.error('Error creating status chart:', error);
        }
    }
    
    function createMonthlyChart(monthlyData) {
        console.log('createMonthlyChart called with:', monthlyData);
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) {
            console.log('Monthly canvas not found');
            return;
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded for monthly chart, showing fallback');
            // Show fallback content with actual data
            const container = canvas.parentElement;
            let fallbackHTML = '<div class="chart-fallback text-start"><h6 class="mb-3">Μηνιαία Δημιουργία:</h6><ul class="list-unstyled">';
            
            monthlyData.forEach(item => {
                fallbackHTML += `<li class="mb-2"><strong>${item.label}:</strong> ${item.count} θέματα</li>`;
            });
            
            fallbackHTML += '</ul></div>';
            container.innerHTML = fallbackHTML;
            return;
        }
        
        console.log('Chart.js is available for monthly chart, creating...');
        
        // Destroy existing chart
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        const labels = monthlyData.map(item => item.label);
        const data = monthlyData.map(item => item.count);
        
        console.log('Monthly chart data:', { labels, data });
        
        try {
            monthlyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Νέα Θέματα',
                        data: data,
                        borderColor: '#8B0000',
                        backgroundColor: 'rgba(139, 0, 0, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#8B0000',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Νέα θέματα: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
            console.log('Monthly chart created successfully');
        } catch (error) {
            console.error('Error creating monthly chart:', error);
        }
    }
    
    function updateRecentActivity(activities) {
        const container = document.getElementById('recentActivityList');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Δεν υπάρχει πρόσφατη δραστηριότητα</p>
                </div>
            `;
            return;
        }
        
        const activityIcons = {
            'created': 'fas fa-plus-circle text-success',
            'assigned': 'fas fa-user-check text-primary',
            'updated': 'fas fa-edit text-warning',
            'completed': 'fas fa-check-circle text-success'
        };
        
        let html = '';
        activities.forEach((activity, index) => {
            const icon = activityIcons[activity.activity_type] || 'fas fa-circle text-muted';
            const actionText = getActivityText(activity.activity_type);
            
            html += `
                <div class="activity-item d-flex align-items-start mb-3 pb-2 border-bottom">
                    <div class="activity-icon me-3 mt-1">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-content flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="fw-bold mb-0 text-bordeaux">
                                ${actionText}
                            </h6>
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                ${activity.date}
                            </small>
                        </div>
                        <p class="text-muted mb-0 small">
                            ${activity.title.length > 60 ? 
                                activity.title.substring(0, 60) + '...' : 
                                activity.title}
                        </p>
                        ${activity.student_name ? `
                            <div class="mt-1">
                                <span class="badge bg-light text-dark small">
                                    <i class="fas fa-user me-1"></i>${activity.student_name}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function getActivityText(activityType) {
        const activityTexts = {
            'created': 'Δημιουργήθηκε νέο θέμα',
            'assigned': 'Ανατέθηκε σε φοιτητή',
            'updated': 'Ενημερώθηκε θέμα',
            'completed': 'Ολοκληρώθηκε θέμα'
        };
        
        return activityTexts[activityType] || 'Νέα δραστηριότητα';
    }

    // ===== UC13 NOTES FUNCTIONALITY =====
    function initializeNotesSystem() {
        // Initialize event listeners for notes
        const addNoteBtn = document.getElementById('addNoteBtn');
        const cancelNoteBtn = document.getElementById('cancelNoteBtn');
        const noteForm = document.getElementById('noteForm');
        const addNoteForm = document.getElementById('addNoteForm');

        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', showAddNoteForm);
        }

        if (cancelNoteBtn) {
            cancelNoteBtn.addEventListener('click', hideAddNoteForm);
        }

        if (noteForm) {
            noteForm.addEventListener('submit', handleNoteSubmit);
        }
    }

    function showAddNoteForm() {
        const addNoteForm = document.getElementById('addNoteForm');
        const addNoteBtn = document.getElementById('addNoteBtn');
        
        if (addNoteForm && addNoteBtn) {
            addNoteForm.style.display = 'block';
            addNoteBtn.style.display = 'none';
            
            // Focus on the title input
            const titleInput = document.getElementById('noteTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }
    }

    function hideAddNoteForm() {
        const addNoteForm = document.getElementById('addNoteForm');
        const addNoteBtn = document.getElementById('addNoteBtn');
        const noteForm = document.getElementById('noteForm');
        
        if (addNoteForm && addNoteBtn) {
            addNoteForm.style.display = 'none';
            addNoteBtn.style.display = 'inline-block';
            
            // Reset form
            if (noteForm) {
                noteForm.reset();
            }
        }
    }

    async function handleNoteSubmit(event) {
        event.preventDefault();
        
        const thesisId = getCurrentThesisId();
        
        const formData = new FormData(event.target);
        const noteData = {
            thesis_id: thesisId,
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type')
        };

        // Check if thesisId is valid
        if (!thesisId) {
            console.error('Cannot submit note: thesisId is not set');
            showNotification('Σφάλμα: Δεν έχει επιλεγεί διπλωματική', 'error');
            return;
        }

        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                credentials: 'same-origin', // Include session cookies
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noteData)
            });

            if (response.ok) {
                const result = await response.json();
                showNotification('Η σημείωση αποθηκεύτηκε επιτυχώς!', 'success');
                hideAddNoteForm();
                
                // Only reload if thesisId is valid
                if (thesisId) {
                    await loadThesisNotes(thesisId); // Reload notes
                }
            } else {
                throw new Error('Σφάλμα κατά την αποθήκευση της σημείωσης');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            showNotification('Σφάλμα κατά την αποθήκευση της σημείωσης', 'error');
        }
    }

    async function loadThesisNotes(thesisId) {
        const notesLoading = document.getElementById('notesLoading');
        const notesList = document.getElementById('notesList');
        const noNotesMessage = document.getElementById('noNotesMessage');
        
        // Check if thesisId is valid
        if (!thesisId || thesisId === 'undefined') {
            console.warn('loadThesisNotes called with invalid thesisId:', thesisId);
            return;
        }
        
        if (!notesList) return;

        // Show loading state
        if (notesLoading) {
            notesLoading.style.display = 'block';
        }
        
        if (noNotesMessage) {
            noNotesMessage.style.display = 'none';
        }

        try {
            const response = await fetch(`/api/notes/${thesisId}`, {
                method: 'GET',
                credentials: 'same-origin', // Include session cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    renderNotes(result.data);
                } else {
                    console.error('API returned success: false', result);
                    throw new Error(result.message || 'Failed to load notes');
                }
            } else {
                throw new Error('Failed to load notes');
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            showNotification('Σφάλμα κατά τη φόρτωση των σημειώσεων', 'error');
            
            if (noNotesMessage) {
                noNotesMessage.innerHTML = `
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p class="text-muted mb-0">Σφάλμα φόρτωσης σημειώσεων</p>
                `;
                noNotesMessage.style.display = 'block';
            }
        } finally {
            if (notesLoading) {
                notesLoading.style.display = 'none';
            }
        }
    }

    function renderNotes(notes) {
        const notesList = document.getElementById('notesList');
        const noNotesMessage = document.getElementById('noNotesMessage');
        const notesLoading = document.getElementById('notesLoading');
        
        if (!notesList) {
            console.error('notesList element not found');
            return;
        }

        // Clear existing content except loading and no notes message
        const existingNotes = notesList.querySelectorAll('.note-item');
        existingNotes.forEach(note => note.remove());

        if (notes && notes.length > 0) {
            if (noNotesMessage) {
                noNotesMessage.style.display = 'none';
            }

            notes.forEach((note) => {
                const noteElement = createNoteElement(note);
                notesList.appendChild(noteElement);
            });
        } else {
            if (noNotesMessage) {
                noNotesMessage.style.display = 'block';
            }
        }
    }

    function createNoteElement(note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.dataset.noteId = note.id;

        const typeClass = `note-type-${note.comment_type}`;
        const typeLabel = getNoteTypeLabel(note.comment_type);
        const formattedDate = formatNoteDate(note.comment_date);
        const canEdit = note.professor_id === getCurrentUserId(); // Using professor_id instead of author_id

        noteDiv.innerHTML = `
            <div class="note-header">
                <div class="note-title">${escapeHtml(note.title || 'Χωρίς τίτλο')}</div>
                <div class="note-meta">
                    <span class="note-type-badge ${typeClass}">${typeLabel}</span>
                    <div class="note-date">${formattedDate}</div>
                </div>
                ${canEdit ? `
                    <div class="note-actions">
                        <button type="button" class="btn btn-outline-secondary btn-sm me-1" onclick="editNote(${note.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteNote(${note.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="note-content">${escapeHtml(note.comment || '')}</div>
            <div class="note-author">
                <small class="text-muted">
                    <i class="fas fa-user me-1"></i>
                    ${escapeHtml(note.author_full_name || note.author_name || 'Άγνωστος χρήστης')}
                </small>
            </div>
        `;

        return noteDiv;
    }

    function getNoteTypeLabel(type) {
        const labels = {
            'general': 'Γενική',
            'progress': 'Πρόοδος',
            'meeting': 'Συνάντηση',
            'deadline': 'Προθεσμία',
            'issue': 'Πρόβλημα',
            'achievement': 'Επίτευγμα'
        };
        return labels[type] || 'Γενική';
    }

    function formatNoteDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('el-GR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getCurrentUserId() {
        // This should return the current user's ID
        // You might get this from a global variable, local storage, or JWT token
        return window.currentUserId || null;
    }

    // Global functions for note actions (called from HTML)
    window.editNote = async function(noteId) {
        // Implementation for editing notes
        console.log('Edit note:', noteId);
        // You can show a modal or inline edit form
        showNotification('Λειτουργία επεξεργασίας σημείωσης σε ανάπτυξη', 'info');
    };

    window.deleteNote = async function(noteId) {
        if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη σημείωση;')) {
            return;
        }

        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: 'DELETE',
                credentials: 'same-origin', // Include session cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showNotification('Η σημείωση διαγράφηκε επιτυχώς!', 'success');
                
                // Get current thesis ID and reload notes if valid
                const thesisId = getCurrentThesisId();
                if (thesisId) {
                    await loadThesisNotes(thesisId); // Reload notes
                }
            } else {
                throw new Error('Σφάλμα κατά τη διαγραφή της σημείωσης');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            showNotification('Σφάλμα κατά τη διαγραφή της σημείωσης', 'error');
        }
    };

    // Initialize notes system when thesis details are loaded
    function initializeThesisDetailsWithNotes(thesisId) {
        // Just validate the thesisId parameter and initialize the system
        if (!thesisId) {
            console.warn('initializeThesisDetailsWithNotes called with invalid thesisId:', thesisId);
            return;
        }
        
        initializeNotesSystem();
        loadThesisNotes(thesisId);
        
        // Show add note button only for supervisors
        const addNoteBtn = document.getElementById('addNoteBtn');
        const userRole = getCurrentUserRole();
        
        if (addNoteBtn && userRole === 'supervisor') {
            addNoteBtn.style.display = 'inline-block';
        }
    }

    function getCurrentUserRole() {
        // Return the current user's role for the specific thesis
        return currentUserRole || 'member';
    }

    // ===== UC11: COMMITTEE INVITATIONS FUNCTIONALITY =====
    function initializeCommitteeInvitations() {
        const committeeInvitationsLink = document.getElementById('committeeInvitationsLink');
        
        if (committeeInvitationsLink) {
            committeeInvitationsLink.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('committeeInvitationsSection');
                updateMainTitle('Προσκλήσεις σε Τριμελή Επιτροπή');
                
                // Scroll to top of the page first
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Then load invitations
                loadCommitteeInvitations();
                
                // Set this as active
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
            });
        }

        // Initialize filter buttons
        initializeInvitationFilters();
        
        // Initialize modal event listeners
        initializeInvitationModals();
        
        // Initialize retry button
        const retryBtn = document.getElementById('retryInvitationsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                showInvitationsError(false);
                loadCommitteeInvitations();
            });
        }
        
        // Add event listener for clear filters custom event
        document.addEventListener('clearFilters', function() {
            applyInvitationFilters();
        });
    }

    function initializeInvitationFilters() {
        const statusFilter = document.getElementById('invitationStatusFilter');
        const searchInput = document.getElementById('invitationsSearch');
        const clearSearchBtn = document.getElementById('clearInvitationsSearchBtn');
        
        // Status filter dropdown
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                applyInvitationFilters();
            });
        }
        
        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                applyInvitationFilters();
            });
        }
        
        // Clear search button
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (searchInput) {
                    searchInput.value = '';
                    applyInvitationFilters();
                }
            });
        }
        
        // Legacy support for data-invitation-filter buttons (if any)
        const filterButtons = document.querySelectorAll('[data-invitation-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-invitation-filter');
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Apply filter using legacy method
                filterInvitations(filter);
            });
        });
    }

    function initializeInvitationModals() {
        // Accept invitation modal
        const acceptModal = document.getElementById('acceptInvitationModal');
        const acceptBtn = document.getElementById('confirmAcceptInvitation');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                const invitationId = this.getAttribute('data-invitation-id');
                if (invitationId) {
                    respondToInvitation(invitationId, 'accepted');
                }
            });
        }

        // Decline invitation modal
        const declineModal = document.getElementById('declineInvitationModal');
        const declineBtn = document.getElementById('confirmDeclineInvitation');
        
        if (declineBtn) {
            declineBtn.addEventListener('click', function() {
                const invitationId = this.getAttribute('data-invitation-id');
                if (invitationId) {
                    respondToInvitation(invitationId, 'declined');
                }
            });
        }
    }

    async function loadCommitteeInvitations() {
        try {
            console.log('Starting loadCommitteeInvitations...');
            showInvitationsLoading(true);
            
            const response = await fetch('/api/professor/committee-invitations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Fetch response received:', response.ok, 'Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Data received:', data);
            
            // Check if response has the expected structure
            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
            // Show content first, then load data
            console.log('Hiding loading, showing content...');
            showInvitationsLoading(false);
            
            // Additional immediate cleanup - hide all loading states in committee section
            const committeeSection = document.getElementById('committeeInvitationsSection');
            if (committeeSection) {
                const allLoadingElements = committeeSection.querySelectorAll('[id*="Loading"], [class*="loading"], [class*="spinner"]');
                allLoadingElements.forEach(el => {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                });
                console.log('Hidden all loading elements in committee section:', allLoadingElements.length);
            }
            
            displayInvitations(data.invitations || []);
            updateInvitationsSummary(data.summary || {});
            
        } catch (error) {
            console.error('Error loading committee invitations:', error);
            showNotification('Σφάλμα κατά τη φόρτωση των προσκλήσεων: ' + error.message, 'error');
            showInvitationsLoading(false);
            showInvitationsError(true, error.message);
            displayInvitations([]);
        }
    }

    function displayInvitations(invitations) {
        const container = document.getElementById('invitationsCardsContainer');
        const noInvitationsElement = document.getElementById('noInvitationsFound');
        
        if (!container) {
            console.error('Invitations container not found');
            return;
        }

        // Show the container
        container.style.display = 'block';
        
        if (invitations.length === 0) {
            container.style.display = 'none';
            if (noInvitationsElement) {
                noInvitationsElement.style.display = 'block';
            }
            return;
        }

        // Hide no invitations message
        if (noInvitationsElement) {
            noInvitationsElement.style.display = 'none';
        }

        const invitationsHTML = invitations.map(invitation => createInvitationCard(invitation)).join('');
        container.innerHTML = invitationsHTML;
        
        // Add event listeners to action buttons
        attachInvitationEventListeners();
        
        // Apply any active filters
        applyInvitationFilters();
        
        // Ensure loading is hidden - fallback
        console.log('displayInvitations completed, ensuring loading is hidden...');
        showInvitationsLoading(false);
        
        // Additional fallback - remove any remaining loading elements
        setTimeout(() => {
            const remainingLoadingElements = document.querySelectorAll('#invitationsLoading');
            remainingLoadingElements.forEach(el => {
                el.remove();
                console.log('Removed remaining loading element');
            });
        }, 50);
    }

    function applyInvitationFilters() {
        const statusFilter = document.getElementById('invitationStatusFilter');
        const searchInput = document.getElementById('invitationsSearch');
        const cards = document.querySelectorAll('.invitation-card');
        const noInvitationsElement = document.getElementById('noInvitationsFound');
        
        let visibleCount = 0;
        const totalCount = cards.length;
        
        cards.forEach(card => {
            let showCard = true;
            
            // Status filter
            if (statusFilter && statusFilter.value) {
                const cardStatus = card.getAttribute('data-status');
                if (cardStatus !== statusFilter.value) {
                    showCard = false;
                }
            }
            
            // Search filter
            if (searchInput && searchInput.value.trim() && showCard) {
                const searchTerm = searchInput.value.trim().toLowerCase();
                const cardText = card.textContent.toLowerCase();
                
                if (!cardText.includes(searchTerm)) {
                    showCard = false;
                }
            }
            
            // Show/hide card
            if (showCard) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update visibility of container and no results message
        const container = document.getElementById('invitationsCardsContainer');
        if (visibleCount === 0 && totalCount > 0) {
            if (container) container.style.display = 'none';
            if (noInvitationsElement) {
                noInvitationsElement.style.display = 'block';
                noInvitationsElement.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h6 class="text-muted">Δεν βρέθηκαν προσκλήσεις που να ταιριάζουν με τα κριτήρια αναζήτησης</h6>
                        <button type="button" class="btn btn-outline-primary btn-sm mt-2" onclick="clearInvitationFilters()">
                            <i class="fas fa-times me-1"></i>Καθαρισμός φίλτρων
                        </button>
                    </div>
                `;
            }
        } else if (visibleCount > 0) {
            if (container) container.style.display = 'block';
            if (noInvitationsElement) noInvitationsElement.style.display = 'none';
        }
        
        // Update filtered count display
        updateFilteredInvitationsCount(visibleCount, totalCount);
        
        console.log(`Applied invitation filters: ${visibleCount}/${totalCount} cards visible`);
    }


    function updateFilteredInvitationsCount(filtered, total) {
        const filteredElement = document.getElementById('filteredInvitationsCount');
        const totalDisplayElement = document.getElementById('totalInvitationsDisplayCount');
        
        if (filteredElement) {
            filteredElement.textContent = filtered;
        }
        
        if (totalDisplayElement) {
            totalDisplayElement.textContent = total;
        }
    }

    function createInvitationCard(invitation) {
        const statusClass = `invitation-status-${invitation.status}`;
        const statusText = getStatusText(invitation.status);
        const canRespond = invitation.status === 'pending';
        
        return `
            <div class="invitation-card" data-invitation-id="${invitation.id}" data-status="${invitation.status}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold">${invitation.thesis_title}</h6>
                        <small class="text-muted">Φοιτητής: ${invitation.student_name} (${invitation.student_id})</small>
                    </div>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="invitation-detail-row">
                                <div class="invitation-detail-label">Ρόλος:</div>
                                <div class="invitation-detail-value">${getRoleText(invitation.role)}</div>
                            </div>
                            <div class="invitation-detail-row">
                                <div class="invitation-detail-label">Ημερομηνία Πρόσκλησης:</div>
                                <div class="invitation-detail-value">${formatDate(invitation.invitation_date)}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="invitation-detail-row">
                                <div class="invitation-detail-label">Επιβλέπων:</div>
                                <div class="invitation-detail-value">${invitation.supervisor_name}</div>
                            </div>
                            ${invitation.acceptance_date ? `
                                <div class="invitation-detail-row">
                                    <div class="invitation-detail-label">Ημερομηνία Απάντησης:</div>
                                    <div class="invitation-detail-value">${formatDate(invitation.acceptance_date)}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${canRespond ? `
                        <div class="invitation-actions">
                            <button class="btn btn-bordeaux btn-accept-invitation" 
                                    data-invitation-id="${invitation.id}" 
                                    data-thesis-title="${invitation.thesis_title}">
                                <i class="fas fa-check me-1"></i>Αποδοχή
                            </button>
                            <button class="btn btn-outline-danger btn-decline-invitation" 
                                    data-invitation-id="${invitation.id}" 
                                    data-thesis-title="${invitation.thesis_title}">
                                <i class="fas fa-times me-1"></i>Απόρριψη
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function attachInvitationEventListeners() {
        // Accept buttons
        document.querySelectorAll('.btn-accept-invitation').forEach(button => {
            button.addEventListener('click', function() {
                const invitationId = this.getAttribute('data-invitation-id');
                const thesisTitle = this.getAttribute('data-thesis-title');
                showAcceptModal(invitationId, thesisTitle);
            });
        });

        // Decline buttons
        document.querySelectorAll('.btn-decline-invitation').forEach(button => {
            button.addEventListener('click', function() {
                const invitationId = this.getAttribute('data-invitation-id');
                const thesisTitle = this.getAttribute('data-thesis-title');
                showDeclineModal(invitationId, thesisTitle);
            });
        });
    }

    function showAcceptModal(invitationId, thesisTitle) {
        const modal = new bootstrap.Modal(document.getElementById('acceptInvitationModal'));
        const thesisTitleElement = document.getElementById('acceptModalThesisTitle');
        const confirmBtn = document.getElementById('confirmAcceptInvitation');
        
        if (thesisTitleElement) {
            thesisTitleElement.textContent = thesisTitle;
        }
        
        if (confirmBtn) {
            confirmBtn.setAttribute('data-invitation-id', invitationId);
        }
        
        modal.show();
    }

    function showDeclineModal(invitationId, thesisTitle) {
        const modal = new bootstrap.Modal(document.getElementById('declineInvitationModal'));
        const thesisTitleElement = document.getElementById('declineModalThesisTitle');
        const confirmBtn = document.getElementById('confirmDeclineInvitation');
        
        if (thesisTitleElement) {
            thesisTitleElement.textContent = thesisTitle;
        }
        
        if (confirmBtn) {
            confirmBtn.setAttribute('data-invitation-id', invitationId);
        }
        
        modal.show();
    }

    async function respondToInvitation(invitationId, response) {
        try {
            const responseBody = {
                invitation_id: invitationId,
                response: response
            };

            const result = await fetch('/api/professor/committee-invitations/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(responseBody)
            });

            if (!result.ok) {
                throw new Error('Αποτυχία απάντησης στην πρόσκληση');
            }

            const data = await result.json();
            
            // Close modal
            const activeModal = document.querySelector('.modal.show');
            if (activeModal) {
                const modal = bootstrap.Modal.getInstance(activeModal);
                if (modal) modal.hide();
            }

            // Show success message
            const responseText = response === 'accepted' ? 'έγινε αποδεκτή' : 'απορρίφθηκε';
            showNotification(`Η πρόσκληση ${responseText} επιτυχώς`, 'success');
            
            // Reload invitations
            loadCommitteeInvitations();
            
        } catch (error) {
            console.error('Error responding to invitation:', error);
            showNotification('Σφάλμα κατά την απάντηση στην πρόσκληση', 'error');
        }
    }

    function filterInvitations(status) {
        const cards = document.querySelectorAll('.invitation-card');
        
        cards.forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            
            if (status === 'all' || cardStatus === status) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function updateInvitationsSummary(summary) {
        const totalElement = document.getElementById('totalInvitationsCount');
        const pendingElement = document.getElementById('pendingInvitationsCount');
        const acceptedElement = document.getElementById('acceptedInvitationsCount');
        const declinedElement = document.getElementById('declinedInvitationsCount');
        
        console.log('Updating invitations summary:', summary);
        
        if (totalElement) {
            totalElement.textContent = summary.total || 0;
            console.log('Updated total invitations to:', summary.total || 0);
        } else {
            console.warn('totalInvitationsCount element not found');
        }
        
        if (pendingElement) {
            pendingElement.textContent = summary.pending || 0;
            console.log('Updated pending invitations to:', summary.pending || 0);
        } else {
            console.warn('pendingInvitationsCount element not found');
        }
        
        if (acceptedElement) {
            acceptedElement.textContent = summary.accepted || 0;
            console.log('Updated accepted invitations to:', summary.accepted || 0);
        } else {
            console.warn('acceptedInvitationsCount element not found');
        }
        
        if (declinedElement) {
            declinedElement.textContent = summary.declined || 0;
            console.log('Updated declined invitations to:', summary.declined || 0);
        } else {
            console.warn('declinedInvitationsCount element not found');
        }
    }

    function showInvitationsLoading(show) {
        const loadingElement = document.getElementById('invitationsLoading');
        const contentElement = document.getElementById('invitationsContent');
        const errorElement = document.getElementById('invitationsError');
        
        console.log('showInvitationsLoading called with:', show);
        console.log('Loading element found:', !!loadingElement);
        console.log('Content element found:', !!contentElement);
        console.log('Error element found:', !!errorElement);
        
        if (loadingElement) {
            if (show) {
                loadingElement.style.display = 'block';
                loadingElement.style.visibility = 'visible';
            } else {
                loadingElement.style.display = 'none';
                loadingElement.style.visibility = 'hidden';
            }
        } else {
            console.error('invitationsLoading element not found');
        }
        
        if (contentElement) {
            if (show) {
                contentElement.style.display = 'none';
            } else {
                contentElement.style.display = 'block';
                contentElement.style.visibility = 'visible';
            }
            console.log('Content element display set to:', contentElement.style.display);
        } else {
            console.error('invitationsContent element not found');
        }
        
        // Hide error when showing loading or content
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    function showInvitationsError(show, message = 'Σφάλμα φόρτωσης προσκλήσεων') {
        const errorElement = document.getElementById('invitationsError');
        const errorMessageElement = document.getElementById('invitationsErrorMessage');
        const contentElement = document.getElementById('invitationsContent');
        const loadingElement = document.getElementById('invitationsLoading');
        
        if (errorElement) {
            if (show) {
                errorElement.style.display = 'block';
                if (errorMessageElement) {
                    errorMessageElement.textContent = message;
                }
            } else {
                errorElement.style.display = 'none';
            }
        }
        
        // Hide other elements when showing error
        if (show) {
            if (contentElement) contentElement.style.display = 'none';
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }

    function getStatusText(status) {
        const statusMap = {
            'pending': 'Εκκρεμής',
            'accepted': 'Αποδεκτή',
            'declined': 'Απορριφθείσα'
        };
        return statusMap[status] || status;
    }

    function getRoleText(role) {
        const roleMap = {
            'member': 'Μέλος Επιτροπής',
            'president': 'Πρόεδρος Επιτροπής',
            'secretary': 'Γραμματέας Επιτροπής'
        };
        return roleMap[role] || role;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('el-GR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async function acceptCommitteeInvitation(thesisId, invitationId) {
        try {
            // First, check current committee status
            const response = await fetch(`/api/thesis/${thesisId}/committee-status`);
            const status = await response.json();
            
            if (status.acceptedMembers >= 2) {
                alert('Η επιτροπή είναι ήδη πλήρης!');
                return;
            }
            
            // Accept the invitation
            const acceptResponse = await fetch(`/api/committee/accept-invitation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId, thesisId })
            });
            
            const result = await acceptResponse.json();
            
            if (result.committeeComplete) {
                // Committee is now complete - update UI
                showCommitteeCompleteMessage();
                disableOtherInvitations(thesisId);
            }
            
        } catch (error) {
            console.error('Error accepting invitation:', error);
        }
    }

    // Helper function to show committee complete message
    function showCommitteeCompleteMessage() {
        showNotification('🎉 Η επιτροπή ολοκληρώθηκε! Όλες οι εκκρεμείς προσκλήσεις ακυρώθηκαν αυτόματα.', 'success');
        
        // Optional: Show a more detailed modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>Επιτροπή Ολοκληρώθηκε
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Η επιτροπή της διπλωματικής έχει ολοκληρωθεί επιτυχώς με:</p>
                        <ul>
                            <li>1 Επιβλέπων Καθηγητής</li>
                            <li>2 Μέλη Επιτροπής</li>
                        </ul>
                        <p class="text-muted mt-3">
                            <i class="fas fa-info-circle me-2"></i>
                            Όλες οι άλλες εκκρεμείς προσκλήσεις ακυρώθηκαν αυτόματα.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">Εντάξει</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Clean up modal after it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // Helper function to disable other invitations in the UI
    function disableOtherInvitations(thesisId) {
        // Find all pending invitation cards for this thesis
        const invitationCards = document.querySelectorAll('.invitation-card[data-status="pending"]');
        
        invitationCards.forEach(card => {
            // Add visual indication that it's been canceled
            card.classList.add('invitation-canceled');
            card.style.opacity = '0.6';
            
            // Update the status badge
            const statusBadge = card.querySelector('.badge');
            if (statusBadge) {
                statusBadge.textContent = 'Ακυρώθηκε';
                statusBadge.className = 'badge bg-secondary';
            }
            
            // Disable action buttons
            const actionButtons = card.querySelectorAll('.btn-accept-invitation, .btn-decline-invitation');
            actionButtons.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-ban me-1"></i>Ακυρώθηκε';
                btn.className = 'btn btn-secondary btn-sm';
            });
            
            // Add a notice
            const cardBody = card.querySelector('.card-body');
            if (cardBody && !cardBody.querySelector('.cancellation-notice')) {
                const notice = document.createElement('div');
                notice.className = 'cancellation-notice mt-2 p-2 bg-light border-start border-warning border-3';
                notice.innerHTML = `
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Αυτή η πρόσκληση ακυρώθηκε αυτόματα επειδή η επιτροπή ολοκληρώθηκε.
                    </small>
                `;
                cardBody.appendChild(notice);
            }
        });
        
        // Refresh the invitations list to get updated data from server
        setTimeout(() => {
            loadCommitteeInvitations();
        }, 2000);
    }

    // Make sure to call initializeThesisDetailsWithNotes when loading thesis details
    // This should be integrated with your existing loadThesisDetails function
});
