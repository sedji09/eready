document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim(); // ← Use email
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('error', 'Email and password required');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }) // ← Send email, not username
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message || 'Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = data.redirect || '/dashboard';
      }, 1500);
    } else {
      showAlert('error', data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showAlert('error', 'Network error. Please try again.');
  }
});

function showAlert(type, message) {
  const container = document.getElementById('alert-container');
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  
  container.innerHTML = `
    <div class="alert ${alertClass}">${message}</div>
  `;

  setTimeout(() => container.innerHTML = '', 5000);
}