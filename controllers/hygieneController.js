const db = require('../config/database');
const { Parser } = require('json2csv');
const xml2js = require('xml2js');

// GET /api/inventory/clothes-beddings
const getInventory = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM vw_hygiene_sanitation_inventory ORDER BY batch_no DESC');
    const items = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    res.json({ success: true, items });
  } catch (err) {
    console.error('Get hygiene sanitation inventory error:', err);
    res.status(500).json({ success: false, message: 'Failed to load hygiene sanitation inventory' });
  }
};

// POST /api/inventory/clothes-beddings
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, unit_type, manufactured_date, expiration_date, location, person_in_charge } = req.body;
    await db.query(
      `INSERT INTO hygiene_sanitation_inventory (item_name, category, quantity, unit_type, manufactured_date, expiration_date, location, person_in_charge, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, category, Number(quantity), unit_type || null, manufactured_date || null, expiration_date || null, location, person_in_charge || null, req.session.user?.id || null]
    );
    res.json({ success: true, message: 'Hygiene & Sanitation item added successfully' });
  } catch (err) {
    console.error('Add hygiene sanitation error:', err);
    res.status(500).json({ success: false, message: 'Failed to add hygiene sanitation item' });
  }
};

// PUT /api/inventory/clothes-beddings/:id
const updateItem = async (req, res) => {
  try {
    const id = req.params.id;
    const { item_name, category, quantity, unit_type, manufactured_date, expiration_date, location, person_in_charge } = req.body;
    await db.query(
      `UPDATE hygiene_sanitation_inventory SET item_name=?, category=?, quantity=?, unit_type=?, manufactured_date=?, expiration_date=?, location=?, person_in_charge=? WHERE batch_no=?`,
      [item_name, category, Number(quantity), unit_type || null, manufactured_date || null, expiration_date || null, location, person_in_charge || null, id]
    );
    res.json({ success: true, message: 'Hygiene & Sanitation item updated successfully' });
  } catch (err) {
    console.error('Update hygiene sanitation error:', err);
    res.status(500).json({ success: false, message: 'Failed to update hygiene sanitation item' });
  }
};

// DELETE /api/inventory/clothes-beddings/:id
const deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM hygiene_sanitation_inventory WHERE batch_no=?', [id]);
    res.json({ success: true, message: 'Hygiene & Sanitation item deleted successfully' });
  } catch (err) {
    console.error('Delete hygiene sanitation error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete hygiene sanitation item' });
  }
};

// GET /api/inventory/clothes-beddings/export/:format
const exportInventory = async (req, res) => {
  try {
    const format = req.params.format;
    const rows = await db.query('SELECT * FROM vw_hygiene_sanitation_inventory ORDER BY batch_no ASC');

    if (format === 'json') {
      res.json(rows);
    } else if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('hygiene_sanitation_inventory.csv');
      res.send(csv);
    } else if (format === 'xml') {
      const builder = new xml2js.Builder({ rootName: 'HygieneSanitationInventory', headless: true });
      const xml = builder.buildObject({ item: rows });
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } else {
      res.status(400).json({ success: false, message: 'Unsupported export format' });
    }
  } catch (err) {
    console.error('Export hygiene sanitation error:', err);
    res.status(500).json({ success: false, message: 'Failed to export hygiene sanitation inventory' });
  }
};

// POST /api/inventory/clothes-beddings/import
const importInventory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    let rows = [];

    if (ext === 'csv') {
      const { parseHygieneSanitationCSV } = require('../utils/csvParser');
      rows = await parseHygieneSanitationCSV(req.file.path);
    } else if (ext === 'json') {
      const { parseHygieneSanitationJSON } = require('../utils/jsonParser');
      rows = await parseHygieneSanitationJSON(req.file.path);
    } else if (ext === 'xml') {
      const { parseHygieneSanitationXML } = require('../utils/xmlParser');
      rows = await parseHygieneSanitationXML(req.file.path);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file format' });
    }

    for (const r of rows) {
      await db.query(
        `INSERT INTO hygiene_sanitation_inventory (item_name, category, quantity, unit_type, manufactured_date, expiration_date, location, person_in_charge, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.item_name, r.category, Number(r.quantity || 0), r.unit_type || null, r.manufactured_date || null, r.expiration_date || null, r.location || '', r.person_in_charge || null, req.session.user?.id || null]
      );
    }

    res.json({ success: true, message: 'Hygiene & Sanitation inventory imported successfully' });
  } catch (err) {
    console.error('Import hygiene sanitation error:', err);
    res.status(500).json({ success: false, message: 'Failed to import hygiene sanitation inventory' });
  }
};

module.exports = { getInventory, addItem, updateItem, deleteItem, exportInventory, importInventory };
