const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Ambil semua pesan dalam satu grup
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const query = `
      SELECT m.*, u.username, u.nama_lengkap 
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await db.query(query, [groupId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 2. Kirim pesan ke grup (Real-time Socket.io)
router.post('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { sender_id, content, attachment_url } = req.body;

  if (!sender_id || (!content && !attachment_url)) {
    return res.status(400).json({ error: 'Pesan tidak valid!' });
  }

  try {
    const insertQuery = `
      INSERT INTO messages (group_id, sender_id, content, attachment_url)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(insertQuery, [groupId, sender_id, content || '', attachment_url || '']);
    const newMsg = result.rows[0];

    // Ambil nama sender
    const userRes = await db.query('SELECT username, nama_lengkap FROM users WHERE id = $1', [sender_id]);
    if (userRes.rows.length > 0) {
      newMsg.username = userRes.rows[0].username;
      newMsg.nama_lengkap = userRes.rows[0].nama_lengkap;
    }

    // BROADCAST VIA SOCKET.IO TO GROUP
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('receive_message', newMsg);
      req.io.emit('update_groups'); // refresh order di list chat
    }

    res.status(201).json({ message: 'Pesan terkirim!', data: newMsg });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Setup Multer untuk Upload
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 3. Endpoint Upload File (VN/Foto/Dokumen) ke Grup (Real-time Socket.io)
router.post('/:groupId/upload', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;
  const { sender_id } = req.body;
  
  if (!req.file || !sender_id) {
    return res.status(400).json({ error: 'File dan sender_id wajib ada!' });
  }

  const attachment_url = `/uploads/${req.file.filename}`;

  try {
    const insertQuery = `
      INSERT INTO messages (group_id, sender_id, content, attachment_url)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(insertQuery, [groupId, sender_id, '', attachment_url]);
    const newMsg = result.rows[0];

    // Ambil nama sender
    const userRes = await db.query('SELECT username, nama_lengkap FROM users WHERE id = $1', [sender_id]);
    if (userRes.rows.length > 0) {
      newMsg.username = userRes.rows[0].username;
      newMsg.nama_lengkap = userRes.rows[0].nama_lengkap;
    }

    // BROADCAST VIA SOCKET.IO TO GROUP
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('receive_message', newMsg);
      req.io.emit('update_groups');
    }

    res.status(201).json({ message: 'File berhasil diunggah!', data: newMsg });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
