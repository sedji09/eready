const { pool } = require('../config/database');

/*
POST /inventory/distribute
Body: { category: string, batchNo: number, quantity: number, notes?: string }
- category: one of 'food_water', 'medicine', 'hygiene_sanitation', 'clothes_beddings', 'tools_lights'
- batchNo: primary key in each inventory table (batch_no)
- quantity: positive integer to deduct
Auth: if req.user exists, logs distributed_by as req.user.id; else null
*/

const CATEGORY_TABLES = {
  food_water: 'food_water_inventory',
  medicine: 'medicine_inventory',
  hygiene_sanitation: 'hygiene_sanitation_inventory',
  clothes_beddings: 'clothes_beddings_inventory',
  tools_lights: 'tools_lights_inventory',
};

exports.distribute = async (req, res) => {
  const { category, batchNo, quantity, notes, recipient, contact } = req.body || {};
  const distributedBy = req.user?.id || null;

  try {
    // Basic validation
    if (!category || !CATEGORY_TABLES[category]) {
      return res.status(400).json({ error: 'Invalid or missing category' });
    }
    if (!batchNo || isNaN(Number(batchNo))) {
      return res.status(400).json({ error: 'Invalid or missing batchNo' });
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0 || !Number.isFinite(qty)) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const tableName = CATEGORY_TABLES[category];

    // Start transaction using a dedicated connection
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the row for update to prevent race conditions
      const [rows] = await conn.query(
        `SELECT batch_no, item_name, quantity FROM ${tableName} WHERE batch_no = ? FOR UPDATE`,
        [batchNo]
      );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = rows[0];

    if (item.quantity < qty) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'Insufficient stock', available: item.quantity });
    }

    const newQty = item.quantity - qty;

    // Update inventory quantity
    await conn.query(
      `UPDATE ${tableName} SET quantity = ? WHERE batch_no = ?`,
      [newQty, batchNo]
    );

    // Insert into distribution history
    await conn.query(
      `INSERT INTO distribution_history (category, table_name, batch_no, item_name, quantity, recipient, contact, distributed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [category, tableName, batchNo, item.item_name, qty, recipient || null, contact || null, distributedBy, notes || null]
    );

    await conn.commit();
    conn.release();

    return res.json({ success: true, batchNo, newQuantity: newQty });
    } catch (innerErr) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw innerErr;
    }
  } catch (err) {
    console.error('Distribution error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
