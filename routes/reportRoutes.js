const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/reports/distribution-history
router.get('/distribution-history', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT dh.id,
               dh.created_at AS date,
               u.username AS distributor,
               dh.item_name,
               dh.category AS type,
               dh.batch_no,
               dh.quantity,
               dh.recipient,
               dh.contact,
               dh.notes
        FROM distribution_history dh
        LEFT JOIN users u ON u.id = dh.distributed_by
        ORDER BY dh.created_at DESC, dh.id DESC
        LIMIT 1000
      `);
      conn.release();
      res.json(rows.map(r => ({
        id: r.id,
        date: r.date,
        distributor: r.distributor || '-',
        item_name: r.item_name,
        type: r.type,
        batch_no: r.batch_no,
        quantity: r.quantity,
        recipient: r.recipient || '-',
        contact: r.contact || '-',
        notes: r.notes || '-'
      })));
    } catch (e) {
      conn.release();
      throw e;
    }
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to load distribution history' });
  }
});

module.exports = router;