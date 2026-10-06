// public/js/reset-password.js

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Check if token exists
if (!token) {
  showAlert('error', 'Invalid reset link. Please request a new password reset.');
  document.getElementById('resetPasswordForm').style.display = 'none';
}

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitButton = e.target.querySelector('button[type="submit"]');

  // Client-side validation
  if (password !== confirmPassword) {
    showAlert('error', 'Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters.');
    return;
  }

  // Disable button and show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'RESETTING...';

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        token, 
        password, 
        confirmPassword 
      })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message);
      document.getElementById('resetPasswordForm').reset();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
      showAlert('error', data.message);
      submitButton.disabled = false;
      submitButton.textContent = 'RESET PASSWORD';
    }

  } catch (error) {
    console.error('Error:', error);
    showAlert('error', 'An error occurred. Please try again.');
    submitButton.disabled = false;
    submitButton.textContent = 'RESET PASSWORD';
  }
});

function showAlert(type, message) {
  const alertContainer = document.getElementById('alert-container');
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass}">
      ${message}
    </div>
  `;

  // Auto-hide after 5 seconds (except for success messages before redirect)
  if (type !== 'success') {
    setTimeout(() => {
      alertContainer.innerHTML = '';
    }, 5000);
  }
}