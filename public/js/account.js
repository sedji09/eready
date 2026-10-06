// account.js - Navbar + My Account modal and API integration
(function(){
  function $(sel, root){ return (root||document).querySelector(sel); }
  function createEl(tag, attrs){ const el=document.createElement(tag); if(attrs){ Object.assign(el, attrs);} return el; }

  // Inject topbar into pages that have .main-content
  function injectTopbar(){
    const main = document.querySelector('.main-content');
    if(!main) return;
    let top = document.createElement('div');
    top.className = 'topbar';
    top.innerHTML = `
      <div class="topbar-left"></div>
      <div class="topbar-right">
        <div class="account-menu" id="accountMenu">
          <img id="navAvatar" class="account-avatar" src="" alt="avatar" style="display:none;"/>
          <span id="navInitials" class="account-initials" style="display:none;"></span>
          <span id="navUsername" class="account-username"></span>
          <div class="account-dropdown" id="accountDropdown" style="display:none;">
            <div class="account-summary">
              <img id="ddAvatar" class="account-avatar large" src="" alt="avatar" style="display:none;"/>
              <div>
                <div class="dd-username" id="ddUsername"></div>
                <div class="dd-email" id="ddEmail"></div>
              </div>
            </div>
            <button id="openAccountBtn" class="account-action">Profile</button>
            <button id="logoutBtnTop" class="account-action danger">Logout</button>
          </div>
        </div>
      </div>`;
    main.prepend(top);

    // Toggle dropdown
    const menu = $('#accountMenu');
    menu.addEventListener('click', function(e){
      e.stopPropagation();
      const dd = $('#accountDropdown');
      dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function(){
      const dd=$('#accountDropdown'); if(dd) dd.style.display='none';
    });
  }

  // Inject modal
  function injectModal(){
    const modal = document.createElement('div');
    modal.id = 'accountModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" id="closeAccountModal">&times;</span>
        <h2>My Account</h2>
        <div class="account-form">
          <div class="avatar-section">
            <img id="profileAvatar" class="account-avatar xlarge" src="" alt="avatar" style="display:none;"/>
            <div id="avatarFallback" class="account-initials xlarge" style="display:none;"></div>
            <form id="avatarForm">
              <input type="file" id="avatarInput" name="avatar" accept="image/*" />
              <button type="submit" class="btn-save" style="margin-top:10px;">Upload Avatar</button>
            </form>
          </div>
          <div class="account-right">
            <div class="account-section">
              <h3>Profile</h3>
              <form id="profileForm">
                <div class="form-group">
                  <label for="accUsername">Username</label>
                  <input type="text" id="accUsername" required />
                </div>
                <div class="form-group">
                  <label for="accEmail">Email</label>
                  <input type="email" id="accEmail" required />
                </div>
                <div class="actions-row">
                  <button type="submit" class="btn-save">Save Changes</button>
                </div>
              </form>
            </div>
            <div class="account-section">
              <h3>Change Password</h3>
              <form id="passwordForm">
                <div class="form-group">
                  <label for="currentPassword">Current Password</label>
                  <input type="password" id="currentPassword" required />
                </div>
                <div class="form-row">
                  <div class="form-group half">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" minlength="6" required />
                  </div>
                  <div class="form-group half">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" minlength="6" required />
                  </div>
                </div>
                <div class="actions-row">
                  <button type="submit" class="btn-save">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    $('#closeAccountModal').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
  }

  function openModal(){ const m = $('#accountModal'); if(m) m.style.display='block'; }
  function closeModal(){ const m = $('#accountModal'); if(m) m.style.display='none'; }

  function initialsFrom(name){
    if(!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '';
    const second = parts[1] ? parts[1][0] : '';
    return (first+second).toUpperCase() || first.toUpperCase() || '?';
  }

  async function fetchMe(){
    const res = await fetch('/api/users/me');
    if(!res.ok) throw new Error('Failed to fetch profile');
    const json = await res.json();
    if(!json.success) throw new Error(json.message||'Failed');
    return json.data;
  }

  function renderNavbar(user){
    const navUsername = $('#navUsername');
    const navAvatar = $('#navAvatar');
    const navInitials = $('#navInitials');
    navUsername.textContent = user.username || '';

    if(user.avatar){
      const bust = user.avatar + (user.avatar.includes('?') ? '&' : '?') + 't=' + Date.now();
      navAvatar.src = bust;
      navAvatar.style.display='inline-block';
      navInitials.style.display='none';
    } else {
      navAvatar.style.display='none';
      navInitials.textContent = initialsFrom(user.username || user.email);
      navInitials.style.display='inline-flex';
    }

    $('#ddUsername').textContent = user.username || '';
    $('#ddEmail').textContent = user.email || '';
    const ddAvatar = $('#ddAvatar');
    if(user.avatar){ ddAvatar.src = user.avatar; ddAvatar.style.display='inline-block'; }
    else { ddAvatar.style.display='none'; }
  }

  function fillAccountForm(user){
    $('#accUsername').value = user.username || '';
    $('#accEmail').value = user.email || '';
    const img = $('#profileAvatar');
    const fb = $('#avatarFallback');
    if(user.avatar){
      const bust = user.avatar + (user.avatar.includes('?') ? '&' : '?') + 't=' + Date.now();
      img.src = bust; img.style.display='inline-block'; fb.style.display='none';
    }
    else { img.style.display='none'; fb.textContent = initialsFrom(user.username||user.email); fb.style.display='inline-flex'; }
  }

  function bindActions(){
    const openBtn = document.getElementById('openAccountBtn');
    if(openBtn){ openBtn.addEventListener('click', async function(e){ e.stopPropagation(); const user = await fetchMe(); fillAccountForm(user); openModal(); }); }

    const logoutTop = document.getElementById('logoutBtnTop');
    if(logoutTop){ logoutTop.addEventListener('click', async function(e){ e.stopPropagation(); try{ await fetch('/api/auth/logout',{method:'POST'});}catch(_){} window.location.href='/login'; }); }

    // Profile update
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const payload = { username: $('#accUsername').value.trim(), email: $('#accEmail').value.trim() };
      const res = await fetch('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if(!data.success) { alert(data.message||'Update failed'); return; }
      const me = await fetchMe();
      renderNavbar(me);
      fillAccountForm(me);
      alert('Profile updated');
    });

    // Avatar upload
    const avatarForm = document.getElementById('avatarForm');
    avatarForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const file = document.getElementById('avatarInput').files[0];
      if(!file){ alert('Please select an image'); return; }
      const fd = new FormData(); fd.append('avatar', file);
      const res = await fetch('/api/users/me/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if(!data.success){ alert(data.message||'Upload failed'); return; }
      const me = await fetchMe();
      renderNavbar(me);
      fillAccountForm(me);
      alert('Avatar uploaded');
    });

    // Password update
    const pwdForm = document.getElementById('passwordForm');
    pwdForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if(newPassword.length < 6){ alert('New password must be at least 6 characters'); return; }
      if(newPassword !== confirmPassword){ alert('New password and confirmation do not match'); return; }
      const res = await fetch('/api/users/me/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      const data = await res.json();
      if(!data.success){ alert(data.message||'Password update failed'); return; }
      // Clear fields
      document.getElementById('currentPassword').value='';
      document.getElementById('newPassword').value='';
      document.getElementById('confirmPassword').value='';
      alert('Password updated');
    });
  }

  function injectStyles(){
    const css = `
    .modal-content{max-width: 730px;}
    .topbar{display:flex;justify-content:flex-end;align-items:center;background:transparent;border-bottom:none;box-shadow:none;padding:20px 26px 8px;margin:0;position:sticky;top:0;z-index:2000;pointer-events:none}
    @media(max-width:768px){.topbar{margin:0}}
    .topbar-left{display:none}
    .topbar-right{position:relative;width:100%;pointer-events:none;display:flex;justify-content:flex-end}
    .account-menu{display:flex;align-items:center;gap:14px;cursor:pointer;pointer-events:auto;position:relative;margin-bottom:8px}
    .account-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #eee}
    .account-avatar.large{width:72px;height:72px}
    .account-avatar.xlarge{width:140px;height:140px}
    .account-initials{width:44px;height:44px;border-radius:50%;background:#8B2020;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px}
    .account-initials.xlarge{width:140px;height:140px;font-size:52px}
    .account-username{font-weight:700;color:#333;font-size:16px}
    .account-dropdown{position:absolute;right:0;top:calc(100% + 12px);background:#fff;border:1px solid #e0e0e0;box-shadow:0 16px 36px rgba(0,0,0,0.2);border-radius:12px;min-width:340px;padding:18px;z-index:9999}
    .account-summary{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid #eee;margin-bottom:14px}
    .account-action{width:100%;text-align:left;padding:14px;border-radius:10px;border:1px solid #e0e0e0;background:#fafafa;cursor:pointer;margin-bottom:12px;font-size:15px}
    .account-action:hover{background:#f0f0f0}
    .account-action.danger{background:#8B2020;color:#fff;border-color:#8B2020}
    .account-form{display:grid;grid-template-columns:280px 1fr;gap:28px;align-items:start}
    .account-right{display:flex;flex-direction:column;gap:18px}
    .account-section{background:transparent;padding:0;border:none;border-radius:8px;display:flex;flex-direction:column;gap:12px}
    .account-section h3{font-size:16px;color:#8B2020;margin:0 0 6px 0}
    .form-row{display:flex;gap:12px}
    .form-group.half{flex:1}
    #profileForm .form-group input,#passwordForm .form-group input{width:100%;padding:12px 15px;border:2px solid #ccc;border-radius:5px;font-size:14px}
    #profileForm .form-group input:focus,#passwordForm .form-group input:focus{outline:none;border-color:#8B2020;box-shadow:0 0 0 3px rgba(139, 32, 32, 0.1)}
    .actions-row{display:flex;gap:10px}
    .actions-row .btn-save{min-width:180px}
    .avatar-section{display:flex;flex-direction:column;align-items:center}
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  }

  async function init(){
    injectTopbar();
    injectModal();
    injectStyles();
    try{
      const me = await fetchMe();
      renderNavbar(me);
      bindActions();
    } catch(err){
      // Not authenticated, ignore
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
