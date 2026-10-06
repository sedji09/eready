window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login';
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

  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}