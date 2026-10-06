// Check authentication on page load
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

// Logout functionality
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