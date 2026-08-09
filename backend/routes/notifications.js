const express = require('express');
const router = express.Router();
const db = require('../db');

// Ambil notifikasi milik user
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  try {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tandai semua notifikasi sudah dibaca
router.post('/read-all', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    res.json({ message: 'Semua notifikasi telah ditandai dibaca.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
