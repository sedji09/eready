window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login';
      return;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login';
  }

  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link && link !== '#') {
        window.location.href = link;
      }
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
});
