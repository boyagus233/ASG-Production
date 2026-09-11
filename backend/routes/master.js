const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 🔒 SEMUA ENDPOINT MASTER WAJIB MENGGUNAKAN JWT TOKEN!
router.use(authenticateToken);

// Konfigurasi Multer untuk Upload Avatar dengan validasi ketat
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const avatarFileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedExts.includes(ext) && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, JPEG, PNG, WEBP) yang diizinkan untuk avatar!'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Maksimal 5MB
});

// ─── ROUTES FOR ROLES ───

// Ambil semua roles (Bisa dilihat oleh semua user yang sudah login)
router.get('/roles', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tambah role baru (HANYA ADMIN)
router.post('/roles', requireAdmin, async (req, res) => {
  const { role_name } = req.body;
  if (!role_name) return res.status(400).json({ error: 'Nama role wajib diisi!' });
  
  try {
    const check = await db.query('SELECT * FROM roles WHERE role_name = $1', [role_name]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Role sudah ada!' });

    const insertQuery = 'INSERT INTO roles (role_name) VALUES ($1) RETURNING *';
    const result = await db.query(insertQuery, [role_name]);
    res.status(201).json({ message: 'Role berhasil ditambahkan!', role: result.rows[0] });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Update role (HANYA ADMIN)
router.put('/roles/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;
  if (!role_name) return res.status(400).json({ error: 'Nama role wajib diisi!' });

  try {
    const result = await db.query('UPDATE roles SET role_name = $1 WHERE id = $2 RETURNING *', [role_name, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Role tidak ditemukan' });
    res.json({ message: 'Role berhasil diupdate', role: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Delete role (HANYA ADMIN)
router.delete('/roles/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const checkUser = await db.query('SELECT * FROM users WHERE id_role = $1', [id]);
    if (checkUser.rowCount > 0) return res.status(400).json({ error: 'Role masih digunakan oleh user, tidak bisa dihapus!' });

    const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Role tidak ditemukan' });
    res.json({ message: 'Role berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// ─── ROUTES FOR USERS ───

// Ambil data user (Mencegah Data Leak PII):
// - Admin (Role 1): Melihat data lengkap untuk manajemen user.
// - Member Biasa (Role 2+): HANYA melihat id, username, nama_lengkap, avatar_url, role_name (untuk daftar grup & mention). Data pribadi (email, no_hp, tgl_lahir) DISEMBUNYIKAN!
router.get('/users', async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 1;

    let query;
    if (isAdmin) {
      query = `
        SELECT u.id, u.username, u.nama_lengkap, u.email, u.no_hp, u.avatar_url, u.jenis_kelamin, u.tanggal_lahir, u.id_role, r.role_name 
        FROM users u
        LEFT JOIN roles r ON u.id_role = r.id
        ORDER BY u.created_at DESC
      `;
    } else {
      query = `
        SELECT u.id, u.username, u.nama_lengkap, u.avatar_url, u.id_role, r.role_name 
        FROM users u
        LEFT JOIN roles r ON u.id_role = r.id
        ORDER BY u.created_at DESC
      `;
    }

    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Ambil detail profil user spesifik (Aman & Terotentikasi: data sensitif hanya untuk pemilik akun atau Admin)
router.get('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  const isOwnerOrAdmin = (req.user && req.user.role === 1) || (req.user && req.user.id === targetId);

  try {
    let query;
    if (isOwnerOrAdmin) {
      query = `
        SELECT u.id, u.username, u.nama_lengkap, u.email, u.no_hp, u.avatar_url, u.jenis_kelamin, u.tanggal_lahir, u.id_role, r.role_name 
        FROM users u
        LEFT JOIN roles r ON u.id_role = r.id
        WHERE u.id = $1
      `;
    } else {
      query = `
        SELECT u.id, u.username, u.nama_lengkap, u.avatar_url, u.id_role, r.role_name 
        FROM users u
        LEFT JOIN roles r ON u.id_role = r.id
        WHERE u.id = $1
      `;
    }

    const result = await db.query(query, [targetId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan!' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tambah user baru (HANYA ADMIN)
router.post('/users', requireAdmin, async (req, res) => {
  const { username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin, no_hp, avatar_url } = req.body;

  if (!username || !email || !password || !id_role) {
    return res.status(400).json({ error: 'Username, email, password, dan role wajib diisi!' });
  }

  try {
    const check = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Username atau email sudah digunakan!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO users (username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin, no_hp, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username, email, id_role, avatar_url, no_hp
    `;
    const result = await db.query(insertQuery, [username, email, hashedPassword, nama_lengkap || username, id_role, tanggal_lahir || null, jenis_kelamin || null, no_hp || null, avatar_url || null]);
    res.status(201).json({ message: 'User berhasil ditambahkan!', user: result.rows[0] });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Endpoint Khusus Upload Avatar User
// User hanya boleh mengunggah avatar miliknya sendiri (atau Admin)
router.post('/users/:id/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (req.user.role !== 1 && req.user.id !== targetId) {
    return res.status(403).json({ error: 'Anda hanya diizinkan mengubah foto profil Anda sendiri!' });
  }

  if (!req.file) return res.status(400).json({ error: 'File avatar tidak ditemukan!' });

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const result = await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, nama_lengkap, email, no_hp, avatar_url, id_role', [avatarUrl, targetId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    res.json({ message: 'Avatar berhasil diperbarui!', avatar_url: avatarUrl, user: result.rows[0] });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Gagal mengunggah avatar.' });
  }
});

// Update user (User sendiri atau Admin)
router.put('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  const isAdmin = req.user && req.user.role === 1;

  // Proteksi: Anggota tidak boleh mengubah profil orang lain
  if (!isAdmin && req.user.id !== targetId) {
    return res.status(403).json({ error: 'Anda hanya diizinkan mengubah profil akun Anda sendiri!' });
  }

  const { username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin, no_hp, avatar_url } = req.body;

  // Anggota biasa TIDAK boleh mengubah role mereka sendiri menjadi Admin!
  const finalRoleId = isAdmin ? (id_role || req.user.role) : req.user.role;

  try {
    let query, values;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query = 'UPDATE users SET username=$1, email=$2, password=$3, nama_lengkap=$4, id_role=$5, tanggal_lahir=$6, jenis_kelamin=$7, no_hp=$8, avatar_url=COALESCE($9, avatar_url) WHERE id=$10 RETURNING id, username, nama_lengkap, email, no_hp, avatar_url, id_role';
      values = [username, email, hashedPassword, nama_lengkap || username, finalRoleId, tanggal_lahir || null, jenis_kelamin || null, no_hp || null, avatar_url || null, targetId];
    } else {
      query = 'UPDATE users SET username=$1, email=$2, nama_lengkap=$3, id_role=$4, tanggal_lahir=$5, jenis_kelamin=$6, no_hp=$7, avatar_url=COALESCE($8, avatar_url) WHERE id=$9 RETURNING id, username, nama_lengkap, email, no_hp, avatar_url, id_role';
      values = [username, email, nama_lengkap || username, finalRoleId, tanggal_lahir || null, jenis_kelamin || null, no_hp || null, avatar_url || null, targetId];
    }

    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil diupdate', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Delete user (HANYA ADMIN)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
