const db = require('../config/database');
const { Parser } = require('json2csv');
const xml2js = require('xml2js');

// GET /api/inventory/medicine
const getInventory = async (req, res) => {
  try {
     const rows = await db.query('SELECT * FROM vw_medicine_inventory ORDER BY batch_no DESC'); 
     const items = Array.isArray(rows) ? rows : (rows ? [rows] : []); 
     res.json({ success: true, items });
  } catch (err) {
    console.error('Get medicine inventory error:', err);
    res.status(500).json({ success: false, message: 'Failed to load medicine inventory' });
  }
};

// POST /api/inventory/medicine
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, dosage, manufactured_date, expiration_date, location, person_in_charge } = req.body;
    await db.query(
      `INSERT INTO medicine_inventory (item_name, category, quantity, dosage, manufactured_date, expiration_date, location, person_in_charge, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, category, Number(quantity), dosage || null, manufactured_date || null, expiration_date || null, location, person_in_charge || null, req.session.user?.id || null]
    );
    res.json({ success: true, message: 'Medicine item added successfully' });
  } catch (err) {
    console.error('Add medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to add medicine item' });
  }
};

// PUT /api/inventory/medicine/:id
const updateItem = async (req, res) => {
  try {
    const id = req.params.id;
    const { item_name, category, quantity, dosage, manufactured_date, expiration_date, location, person_in_charge } = req.body;
    await db.query(
      `UPDATE medicine_inventory SET item_name=?, category=?, quantity=?, dosage=?, manufactured_date=?, expiration_date=?, location=?, person_in_charge=? WHERE batch_no=?`,
      [item_name, category, Number(quantity), dosage || null, manufactured_date || null, expiration_date || null, location, person_in_charge || null, id]
    );
    res.json({ success: true, message: 'Medicine item updated successfully' });
  } catch (err) {
    console.error('Update medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to update medicine item' });
  }
};

// DELETE /api/inventory/medicine/:id
const deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM medicine_inventory WHERE batch_no=?', [id]);
    res.json({ success: true, message: 'Medicine item deleted successfully' });
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete medicine item' });
  }
};

// GET /api/inventory/medicine/export/:format
const exportInventory = async (req, res) => {
  try {
    const format = req.params.format;
    const [rows] = await db.query('SELECT * FROM vw_medicine_inventory ORDER BY batch_no ASC');

    if (format === 'json') {
      res.json(rows);
    } else if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('medicine_inventory.csv');
      res.send(csv);
    } else if (format === 'xml') {
      const builder = new xml2js.Builder({ rootName: 'MedicineInventory', headless: true });
      const xml = builder.buildObject({ item: rows });
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } else {
      res.status(400).json({ success: false, message: 'Unsupported export format' });
    }
  } catch (err) {
    console.error('Export medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to export medicine inventory' });
  }
};

// POST /api/inventory/medicine/import
const importInventory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    let rows = [];

    if (ext === 'csv') {
      const { parseMedicineCSV } = require('../utils/csvParser');
      rows = await parseMedicineCSV(req.file.path);
    } else if (ext === 'json') {
      const { parseMedicineJSON } = require('../utils/jsonParser');
      rows = await parseMedicineJSON(req.file.path);
    } else if (ext === 'xml') {
      const { parseMedicineXML } = require('../utils/xmlParser');
      rows = await parseMedicineXML(req.file.path);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file format' });
    }

    for (const r of rows) {
      await db.query(
        `INSERT INTO medicine_inventory (item_name, category, quantity, dosage, manufactured_date, expiration_date, location, person_in_charge, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.item_name, r.category, Number(r.quantity || 0), r.dosage || null, r.manufactured_date || null, r.expiration_date || null, r.location || '', r.person_in_charge || null, req.session.user?.id || null]
      );
    }

    res.json({ success: true, message: 'Medicine inventory imported successfully' });
  } catch (err) {
    console.error('Import medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to import medicine inventory' });
  }
};

module.exports = { getInventory, addItem, updateItem, deleteItem, exportInventory, importInventory };
