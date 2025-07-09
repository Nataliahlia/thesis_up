// Professor Dashboard JavaScript - Clean Version
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let selectedTopic = null;
    let selectedStudent = null;
    let allTheses = [];
    
    // Initialize components
    initializeSidebar();
    initializeLogout();
    initializeCreateTopic();
    initializeAssignTopic();
    initializeMyTheses();
    
    // ===== SIDEBAR FUNCTIONALITY =====
    function initializeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        // Toggle sidebar
        const toggleBtn = document.querySelector('.navbar-toggler');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                if (sidebar && sidebar.style.left === '0px') {
                    sidebar.style.left = '-250px';
                    if (mainContent) {
                        mainContent.style.marginLeft = '0';
                        mainContent.style.width = '100%';
                    }
                } else if (sidebar) {
                    sidebar.style.left = '0px';
                    if (mainContent) {
                        mainContent.style.marginLeft = '250px';
                        mainContent.style.width = 'calc(100% - 250px)';
                    }
                }
            });
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
                }
            });
        }

        // Initialize search functionality
        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('input', debounce(searchStudents, 300));
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
                }
            });
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    function hideAllForms() {
        const forms = ['createTopicForm', 'assignTopicForm', 'myThesesList'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) form.style.display = 'none';
        });
    }
    
    function updateMainTitle(title) {
        const mainTitle = document.getElementById('mainTitle');
        if (mainTitle) mainTitle.textContent = title;
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
                form.reset();
                hideAllForms();
                updateMainTitle('Πίνακας Ελέγχου Καθηγητή');
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
    
    // Search students
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
                    resultsContainer.innerHTML = '<p class="text-muted">Δεν βρέθηκαν φοιτητές</p>';
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
        fetch('/api/professor/my-theses')
        .then(response => response.json())
        .then(theses => {
            allTheses = theses;
            displayTheses(theses);
        })
        .catch(error => {
            console.error('Error loading theses:', error);
            showAlert('Σφάλμα κατά τη φόρτωση των διπλωματικών');
        });
    }
    
    // Display theses
    function displayTheses(theses) {
        const container = document.getElementById('thesesCardsContainer');
        if (!container) return;
        
        if (theses.length === 0) {
            document.getElementById('thesesLoading').style.display = 'none';
            document.getElementById('thesesCardsContainer').style.display = 'none';
            document.getElementById('noThesesFound').style.display = 'block';
            return;
        }
        
        document.getElementById('thesesLoading').style.display = 'none';
        document.getElementById('thesesCardsContainer').style.display = 'block';
        document.getElementById('noThesesFound').style.display = 'none';
        
        container.innerHTML = theses.map(thesis => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${thesis.title}</h5>
                    <p class="card-text">
                        <strong>Φοιτητής:</strong> ${thesis.student || 'Μη ανατεθειμένη'}<br>
                        <strong>Κατάσταση:</strong> <span class="badge ${getStatusBadgeClass(thesis.status)}">${thesis.status}</span><br>
                        <strong>Ρόλος:</strong> <span class="badge ${getRoleBadgeClass(thesis.role)}">${getRoleText(thesis.role)}</span><br>
                        ${thesis.assignDate ? `<strong>Ημερομηνία Ανάθεσης:</strong> ${formatDate(thesis.assignDate)}<br>` : ''}
                        ${thesis.duration ? `<strong>Διάρκεια:</strong> ${formatDuration(thesis.duration)}` : ''}
                    </p>
                    ${thesis.pdfFile ? `<a href="/uploads/thesis-pdfs/${thesis.pdfFile}" target="_blank" class="btn btn-sm btn-outline-primary">Προβολή PDF</a>` : ''}
                </div>
            </div>
        `).join('');
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
});
