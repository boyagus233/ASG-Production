const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Wajib JWT Token untuk semua endpoint notifikasi
router.use(authenticateToken);

// Ambil notifikasi milik user (Paginated, Search & Filter)
router.get('/', async (req, res) => {
  const userId = req.query.userId || (req.user ? req.user.id : null);
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  // Cegah user melihat notifikasi user lain
  if (req.user && req.user.role !== 1 && parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Anda tidak diizinkan mengakses notifikasi pengguna lain!' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = (req.query.search || '').trim();
  const filter = (req.query.filter || 'ALL').trim(); // ALL, UNREAD, READ
  const offset = (page - 1) * limit;

  try {
    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR body ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (filter === 'UNREAD') {
      whereConditions.push(`is_read = FALSE`);
    } else if (filter === 'READ') {
      whereConditions.push(`is_read = TRUE`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const dataQuery = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM notifications ${whereClause}
    `;

    const unreadCountQuery = `
      SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE
    `;

    const [result, countRes, unreadRes] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams),
      db.query(unreadCountQuery, [userId])
    ]);

    const totalCount = parseInt(countRes.rows[0].count);
    const unreadCount = parseInt(unreadRes.rows[0].count);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    if (req.query.raw === 'true') {
      return res.json(result.rows);
    }

    res.json({
      data: result.rows,
      totalCount,
      totalPages,
      unreadCount,
      page,
      limit,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tandai semua notifikasi sudah dibaca
router.post('/read-all', async (req, res) => {
  const userId = req.body.userId || (req.user ? req.user.id : null);
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  if (req.user && req.user.role !== 1 && parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Anda tidak diizinkan menandai notifikasi pengguna lain!' });
  }

  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    res.json({ message: 'Semua notifikasi telah ditandai dibaca.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});
// Simpan push token user (Multi-Device Support)
router.post('/register-token', async (req, res) => {
  const userId = req.body.userId || (req.user ? req.user.id : null);
  const { pushToken } = req.body;
  if (!userId || !pushToken) return res.status(400).json({ error: 'userId dan pushToken diperlukan!' });

  try {
    const query = `
      INSERT INTO user_push_tokens (user_id, push_token)
      VALUES ($1, $2)
      ON CONFLICT (push_token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = NOW()
    `;
    await db.query(query, [userId, pushToken]);
    // Auto-clean stale tokens older than 30 days
    db.query("DELETE FROM user_push_tokens WHERE updated_at < NOW() - INTERVAL '30 days'").catch(() => {});
    res.json({ message: 'Token berhasil disimpan.' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Route untuk Uji Coba Pengiriman Notifikasi Firebase (HANYA ADMIN)
router.post('/send-test', requireAdmin, async (req, res) => {
  const { sendPushNotification } = require('../firebase');
  try {
    const title = req.body.title || 'TEST NOTIFIKASI FIREBASE ASG! 🔔';
    const body = req.body.body || 'Halo sayang! Notifikasi ini berhasil dikirim dari server ke semua HP & Web PWA!';

    // 1. Ambil token push
    const result = await db.query('SELECT push_token, user_id FROM user_push_tokens');
    const tokens = result.rows.map(r => r.push_token).filter(t => t && t !== 'token-bohong-123');

    // 2. Simpan notifikasi ke database untuk semua user yang terdaftar
    const userIds = [...new Set(result.rows.map(r => r.user_id))];
    for (const uid of userIds) {
      await db.query(
        `INSERT INTO notifications (user_id, title, body, is_read, created_at) VALUES ($1, $2, $3, FALSE, NOW())`,
        [uid, title, body]
      );
    }
    
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'Belum ada token push di database.' });
    }

    // 3. Kirim notifikasi Firebase Cloud Messaging
    await sendPushNotification(
      tokens,
      title,
      body,
      { type: 'test' }
    );

    res.json({ message: `Notifikasi terkirim ke ${tokens.length} perangkat.`, tokensCount: tokens.length });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Gagal mengirim notifikasi.' });
  }
});

module.exports = router;
