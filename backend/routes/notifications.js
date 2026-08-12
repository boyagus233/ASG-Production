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
// Simpan push token user
router.post('/register-token', async (req, res) => {
  const { userId, pushToken } = req.body;
  if (!userId || !pushToken) return res.status(400).json({ error: 'userId dan pushToken diperlukan!' });

  try {
    const query = `
      INSERT INTO user_push_tokens (user_id, push_token)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET push_token = EXCLUDED.push_token, updated_at = NOW()
    `;
    await db.query(query, [userId, pushToken]);
    res.json({ message: 'Token berhasil disimpan.' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
