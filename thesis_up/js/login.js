// Check for error parameter in URL
const params = new URLSearchParams(window.location.search);
if (params.get('error') === '1') {
  showError('Λάθος όνομα χρήστη ή κωδικός πρόσβασης!');
}

// Enhanced error display function
function showError(message) {
  const errorDiv = document.getElementById('error-msg');
  const errorText = errorDiv.querySelector('.error-text');
  errorText.textContent = message;
  errorDiv.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function setLoadingState(loading) {
  const form = document.getElementById('loginForm');
  const btn = document.querySelector('.btn-login');
  const btnText = document.querySelector('.btn-text');
  const spinner = document.querySelector('.spinner');
  
  if (loading) {
    form.classList.add('loading');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    btn.disabled = true;
  } else {
    form.classList.remove('loading');
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Password toggle functionality
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggleIcon');
  
  togglePassword.addEventListener('click', function() {
    // Toggle the type attribute
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle the icon
    if (type === 'text') {
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
      togglePassword.setAttribute('title', 'Απόκρυψη κωδικού');
    } else {
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
      togglePassword.setAttribute('title', 'Εμφάνιση κωδικού');
    }
  });
  
  // Login form submission
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get the values from the input fields
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Hide any existing error messages
    document.getElementById('error-msg').style.display = 'none';
    
    // Show loading state
    setLoadingState(true);

    try {
      // Send a POST request to the server with the login credentials
      const response = await fetch('/login', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ username, password }) 
      });

      if (response.status === 200) {
        // Success - redirect to dashboard
        const redirectUrl = await response.text();
        window.location.href = redirectUrl;
      } else if (response.status === 401) {
        // Unauthorized - show error
        const data = await response.json();
        showError(data.error || 'Λάθος όνομα χρήστη ή κωδικός πρόσβασης!');
        setLoadingState(false);
      } else {
        // Other error
        const errorData = await response.json();
        showError(errorData.error || 'Παρουσιάστηκε σφάλμα. Παρακαλώ προσπαθήστε ξανά.');
        setLoadingState(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Σφάλμα σύνδεσης. Παρακαλώ ελέγξτε τη σύνδεσή σας στο διαδίκτυο.');
      setLoadingState(false);
    }
  });
  
  // Add input focus effects
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      if (!this.value) {
        this.parentElement.classList.remove('focused');
      }
    });
  });
});
