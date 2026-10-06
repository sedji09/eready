// public/js/forgot-password.js

document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const submitButton = e.target.querySelector('button[type="submit"]');
  const alertContainer = document.getElementById('alert-container');

  // Disable button and show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'SENDING...';

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message);
      document.getElementById('forgotPasswordForm').reset();
    } else {
      showAlert('error', data.message);
    }

  } catch (error) {
    console.error('Error:', error);
    showAlert('error', 'An error occurred. Please try again.');
  } finally {
    // Re-enable button
    submitButton.disabled = false;
    submitButton.textContent = 'SEND RESET LINK';
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

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}