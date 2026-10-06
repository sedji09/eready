const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { parseCSVToJSON } = require('../utils/csvParser');
const { toXML } = require('../utils/xmlParser');

function getUserId(req) {
  return req.session && req.session.user ? req.session.user.id : null;
}

// GET /api/inventory/clothes-beddings
const getInventory = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        cb.batch_no,
        cb.item_name,
        cb.category,
        cb.quantity,
        cb.condition_status,
        cb.date_acquired,
        cb.location,
        cb.person_in_charge,
        cb.user_id,
        cb.created_at,
        cb.updated_at
      FROM clothes_beddings_inventory cb
      ORDER BY cb.batch_no DESC
    `);
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('getInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to load inventory' });
  }
};

// POST /api/inventory/clothes-beddings
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, condition_status, date_acquired, location, person_in_charge } = req.body;

    if (!item_name || !category || !quantity || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user_id = getUserId(req);

    await query(
      `INSERT INTO clothes_beddings_inventory 
        (item_name, category, quantity, condition_status, date_acquired, location, person_in_charge, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, category, Number(quantity), condition_status, date_acquired, location, person_in_charge, user_id]
    );

    res.json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    console.error('addItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

// PUT /api/inventory/clothes-beddings/:id
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, condition_status, date_acquired, location, person_in_charge } = req.body;

    const result = await query(
      `UPDATE clothes_beddings_inventory
       SET item_name=?, category=?, quantity=?, condition_status=?, date_acquired=?, location=?, person_in_charge=?
       WHERE batch_no=?`,
      [item_name, category, Number(quantity), condition_status, date_acquired, location, person_in_charge, id]
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

// DELETE /api/inventory/clothes-beddings/:id
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM clothes_beddings_inventory WHERE batch_no = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('deleteItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// GET /api/inventory/clothes-beddings/export/:format
const exportInventory = async (req, res) => {
  try {
    const { format } = req.params;
    const items = await query('SELECT * FROM vw_clothes_beddings_inventory ORDER BY batch_no DESC');

    if (format === 'json') return res.json(items);

    if (format === 'csv') {
      const headers = Object.keys(items[0] || {});
      const csv = [headers.join(',')]
        .concat(items.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="clothes_beddings_inventory.csv"');
      return res.send(csv);
    }

    if (format === 'xml') {
      const xml = toXML('inventory', 'item', items);
      res.setHeader('Content-Type', 'application/xml');
      return res.send(xml);
    }

    res.status(400).json({ success: false, message: 'Unsupported export format' });
  } catch (error) {
    console.error('exportInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};

// POST /api/inventory/clothes-beddings/import
const importInventory = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const records = await parseCSVToJSON(req.file.path);
    const user_id = getUserId(req);

    const insertValues = records.map(r => [
      r.item_name, r.category, Number(r.quantity || 0),
      r.condition_status || 'Good', r.date_acquired || null, r.location || '',
      r.person_in_charge || null, user_id
    ]);

    if (insertValues.length === 0)
      return res.status(400).json({ success: false, message: 'No valid data to import' });

    await query(
      `INSERT INTO clothes_beddings_inventory
       (item_name, category, quantity, condition_status, date_acquired, location, person_in_charge, user_id)
       VALUES ${insertValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
      insertValues.flat()
    );

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({ success: true, message: `Imported ${insertValues.length} items successfully` });
  } catch (error) {
    console.error('importInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to import data' });
  }
};

module.exports = {
  getInventory,
  addItem,
  updateItem,
  deleteItem,
  exportInventory,
  importInventory
};
