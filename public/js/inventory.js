let currentItems = [];

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login';
      return;
    }

    loadInventory();
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

    if (response.ok) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
});

async function loadInventory() {
  try {
    const response = await fetch('/api/inventory/food-water');
    const data = await response.json();

    if (data.success) {
      currentItems = data.items;
      displayItems(currentItems);
    } else {
      showAlert('error', data.message || 'Failed to load inventory');
    }
  } catch (error) {
    console.error('Load inventory error:', error);
    showAlert('error', 'Failed to load inventory');
  }
}

function displayItems(items) {
  const tbody = document.getElementById('inventoryBody');
  
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="loading">No items found</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => {
    const status = item.status || computeStatus(item.quantity, item.days_until_expiry);
    let rowClass = '';
    
    // Add row class based on status
    if (status === 'Out of Stock') {
      rowClass = 'row-out-of-stock';
    } else if (status === 'Expired') {
      rowClass = 'row-expired';
    }
    
    return `
    <tr class="${rowClass}">
      <td>${item.batch_no}</td>
      <td>${item.item_name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>${item.location}</td>
      <td>${item.person_in_charge ? escapeHtml(item.person_in_charge) : ''}</td>
      <td>${item.manufactured_date ? formatDate(item.manufactured_date) : ''}</td>
      <td>${formatDate(item.expiration_date)}</td>
      <td class="${getExpiryClass(item.days_until_expiry)}">${item.days_until_expiry} days</td>
      <td>${renderStatus(item)}</td>
      <td>
        <button class="btn-edit" onclick="editItem(${item.batch_no})" title="Edit">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="btn-delete" onclick="deleteItem(${item.batch_no})" title="Delete">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </td>
    </tr>
  `;
  }).join('');
}

function renderStatus(item){
  const status = item.status || computeStatus(item.quantity, item.days_until_expiry);
  const map = {
    'Good': 'status-good',
    'Near Expiry': 'status-near',
    'Expired': 'status-expired',
    'Out of Stock': 'status-out-of-stock',
  };
  const cls = map[status] || 'status-good';
  return `<span class="status-pill ${cls}">${status}</span>`;
}

function computeStatus(quantity, days){
  if (days < 0) return 'Expired';
  if (days < 30) return 'Near Expiry';
  if(quantity <  10) return 'Out of Stock'
  return 'Good';
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    // Handle string dates like "2025-11-26" or timestamps
    let date;
    if (typeof dateString === 'string' && dateString.includes('-') && !dateString.includes('T')) {
      // If it's a simple date string like "2025-11-26", parse it directly
      const [year, month, day] = dateString.split('-');
      date = new Date(year, month - 1, day);
    } else {
      // Otherwise use the standard Date constructor
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function getExpiryClass(days) {
  if (days < 0) return 'expiry-critical';
  if (days < 30) return 'expiry-warning';
  return 'expiry-good';
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = currentItems.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm) ||
    item.location.toLowerCase().includes(searchTerm)
  );
  displayItems(filtered);
});

document.getElementById('sortSelect').addEventListener('change', (e) => {
  const sortBy = e.target.value;
  const sorted = [...currentItems].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1;
    if (a[sortBy] > b[sortBy]) return 1;
    return 0;
  });
  displayItems(sorted);
});

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Add New Item';
  document.getElementById('itemId').value = '';
  document.getElementById('itemForm').reset();
  document.getElementById('itemModal').style.display = 'block';
}

async function editItem(id) {
  const item = currentItems.find(i => i.batch_no === id);
  if (!item) return;

  document.getElementById('modalTitle').textContent = 'Edit Item';
  document.getElementById('itemId').value = item.batch_no;
  document.getElementById('item_name').value = item.item_name;
  document.getElementById('category').value = item.category;
  document.getElementById('quantity').value = item.quantity;
  document.getElementById('expiration_date').value = item.expiration_date.split('T')[0];
  document.getElementById('location').value = item.location;
  document.getElementById('person_in_charge').value = item.person_in_charge || '';
  document.getElementById('manufactured_date').value = item.manufactured_date ? item.manufactured_date.split('T')[0] : '';
  document.getElementById('itemModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('itemModal').style.display = 'none';
}

document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('itemId').value;
  const formData = {
    item_name: document.getElementById('item_name').value,
    category: document.getElementById('category').value,
    quantity: document.getElementById('quantity').value,
    manufactured_date: document.getElementById('manufactured_date').value,
    expiration_date: document.getElementById('expiration_date').value,
    location: document.getElementById('location').value,
    person_in_charge: document.getElementById('person_in_charge').value
  };

  try {
    const url = id ? `/api/inventory/food-water/${id}` : '/api/inventory/food-water';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message);
      closeModal();
      loadInventory();
    } else {
      showAlert('error', data.message);
    }
  } catch (error) {
    console.error('Save error:', error);
    showAlert('error', 'Failed to save item');
  }
});

async function deleteItem(id) {
  const confirmed = await customConfirm('Delete Item', 'Are you sure you want to delete this item?');
  if (!confirmed) return;
  
  try {
    const response = await fetch(`/api/inventory/food-water/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (data.success) {
      showAlert('success', 'Item deleted successfully');
      loadInventory();
    } else {
      showAlert('error', data.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showAlert('error', 'Failed to delete item');
  }
}

function customConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
      <div class="custom-confirm-box">
        <div class="custom-confirm-title">${title}</div>
        <div class="custom-confirm-message">${message}</div>
        <div class="custom-confirm-buttons">
          <button class="custom-confirm-btn cancel" id="confirmCancel">Cancel</button>
          <button class="custom-confirm-btn confirm" id="confirmOk">Delete</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('confirmOk').onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    
    document.getElementById('confirmCancel').onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    };
  });
}

async function exportData(format) {
  try {
    const response = await fetch(`/api/inventory/food-water/export/${format}`);
    
    if (format === 'json') {
      const data = await response.json();
      downloadFile(JSON.stringify(data, null, 2), `inventory.${format}`, `application/${format}`);
    } else {
      const text = await response.text();
      const mimeType = format === 'csv' ? 'text/csv' : 'application/xml';
      downloadFile(text, `inventory.${format}`, mimeType);
    }
  } catch (error) {
    console.error('Export error:', error);
    showAlert('error', 'Failed to export data');
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function showImportModal() {
  document.getElementById('importModal').style.display = 'block';
}

function closeImportModal() {
  document.getElementById('importModal').style.display = 'none';
}

document.getElementById('importForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];

  if (!file) {
    showAlert('error', 'Please select a file');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/inventory/food-water/import', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', data.message);
      closeImportModal();
      loadInventory();
    } else {
      showAlert('error', data.message);
    }
  } catch (error) {
    console.error('Import error:', error);
    showAlert('error', 'Failed to import file');
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

window.onclick = function(event) {
  const itemModal = document.getElementById('itemModal');
  const importModal = document.getElementById('importModal');
  
  if (event.target === itemModal) {
    closeModal();
  }
  if (event.target === importModal) {
    closeImportModal();
  }
}