const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { parseFoodWaterCSVForImport } = require('../utils/csvParser');
const { toXML } = require('../utils/xmlParser');

// Helper: ensure user_id; fallback to null if no session user
function getUserId(req) {
  return req.session && req.session.user ? req.session.user.id : null;
}

// GET /api/inventory/food-water
const getInventory = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        fi.batch_no,
        fi.item_name,
        fi.category,
        fi.quantity,
        fi.manufactured_date,
        fi.expiration_date,
        fi.location,
        fi.person_in_charge,
        fi.user_id,
        fi.created_at,
        fi.updated_at,
        DATEDIFF(fi.expiration_date, CURDATE()) AS days_until_expiry
      FROM food_water_inventory fi
      ORDER BY fi.batch_no DESC
    `);
    const items = rows.map(r => ({
      ...r,
      status: computeStatus(r.quantity, r.days_until_expiry)
    }));
    res.json({ success: true, items });
  } catch (error) {
    console.error('getInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to load inventory' });
  }
};

// POST /api/inventory/food-water
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, manufactured_date, expiration_date, location, person_in_charge } = req.body;

    if (!item_name || !category || !quantity || !expiration_date || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user_id = getUserId(req);

    await query(
      `INSERT INTO food_water_inventory (item_name, category, quantity, manufactured_date, expiration_date, location, person_in_charge, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, category, Number(quantity), manufactured_date || null, expiration_date, location, person_in_charge || null, user_id]
    );

    res.json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    console.error('addItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

// PUT /api/inventory/food-water/:id
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, manufactured_date, expiration_date, location, person_in_charge } = req.body;

    if (!item_name || !category || !quantity || !expiration_date || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await query(
      `UPDATE food_water_inventory
       SET item_name = ?, category = ?, quantity = ?, manufactured_date = ?, expiration_date = ?, location = ?, person_in_charge = ?
       WHERE batch_no = ?`,
      [item_name, category, Number(quantity), manufactured_date || null, expiration_date, location, person_in_charge || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('updateItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// DELETE /api/inventory/food-water/:id
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM food_water_inventory WHERE batch_no = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('deleteItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// GET /api/inventory/food-water/export/:format
const exportInventory = async (req, res) => {
  try {
    const { format } = req.params;
    const items = await query(`
      SELECT 
        batch_no,
        item_name,
        category,
        quantity,
        manufactured_date,
        expiration_date,
        location,
        person_in_charge,
        user_id,
        created_at,
        updated_at,
        DATEDIFF(expiration_date, CURDATE()) AS days_until_expiry
      FROM food_water_inventory 
      ORDER BY batch_no DESC
    `);

    if (format === 'json') {
      return res.json(items);
    }

    if (format === 'csv') {
      const headers = ['batch_no', 'item_name', 'category', 'quantity', 'manufactured_date', 'expiration_date', 'location', 'person_in_charge', 'user_id', 'created_at', 'updated_at', 'days_until_expiry'];
      const csv = [headers.join(',')]
        .concat(items.map(row => headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const s = String(val).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        }).join(',')))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="food_water_inventory.csv"');
      return res.send(csv);
    }

    if (format === 'xml') {
      const xml = toXML('inventory', 'item', items);
      res.setHeader('Content-Type', 'application/xml');
      return res.send(xml);
    }

    return res.status(400).json({ success: false, message: 'Unsupported export format' });
  } catch (error) {
    console.error('exportInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};

// POST /api/inventory/food-water/import
// Expects multipart/form-data with field name 'file' containing CSV
const importInventory = async (req, res) => {
  try {
    // If multer is set in route, we will have req.file
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const records = await parseFoodWaterCSVForImport(filePath);

    if (!records || records.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file is empty or invalid' });
    }

    const user_id = getUserId(req);

    // Normalize and insert
    const insertValues = [];
    for (const r of records) {
      const item_name = r.item_name;
      const category = r.category;
      const quantity = Number(r.quantity || 0);
      let manufactured_date = r.manufactured_date || null;
      let expiration_date = r.expiration_date || null;
      const location = r.location;
      const person_in_charge = r.person_in_charge || null;

      // Helper function to convert date strings to YYYY-MM-DD format
      const convertDateFormat = (dateStr) => {
        if (!dateStr || dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
          return null;
        }
        try {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
          }
          // Parse the date string and convert to YYYY-MM-DD
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            return null;
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return null;
        }
      };

      manufactured_date = convertDateFormat(manufactured_date);
      expiration_date = convertDateFormat(expiration_date);

      if (!item_name || !category || !quantity || !expiration_date || !location) {
        continue; // skip invalid row
      }

      insertValues.push([item_name, category, quantity, manufactured_date, expiration_date, location, person_in_charge, user_id]);
    }

    if (insertValues.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows to import' });
    }

    await query(
      `INSERT INTO food_water_inventory (item_name, category, quantity, manufactured_date, expiration_date, location, person_in_charge, user_id)
       VALUES ${insertValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
      insertValues.flat()
    );

    // Cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch (_) {}

    res.json({ success: true, message: `Imported ${insertValues.length} items successfully` });
  } catch (error) {
    console.error('importInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to import data' });
  }
};

function computeStatus(quantity, days) {
  if (quantity <= 0) return 'Out of Stock';
  if (days < 0) return 'Expired';
  if (days < 30) return 'Near Expiry';
  return 'Good';
}

module.exports = {
  getInventory,
  addItem,
  updateItem,
  deleteItem,
  exportInventory,
  importInventory
};
