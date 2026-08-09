const express = require('express');
const router = express.Router();
const db = require('../db');

// --- ROUTES FOR ROLES ---

// Ambil semua roles
router.get('/roles', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tambah role baru
router.post('/roles', async (req, res) => {
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


// --- ROUTES FOR USERS ---

// Ambil semua user beserta nama role mereka
router.get('/users', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.nama_lengkap, u.email, u.jenis_kelamin, u.tanggal_lahir, r.role_name 
      FROM users u
      LEFT JOIN roles r ON u.id_role = r.id
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Tambah user baru (Admin level)
router.post('/users', async (req, res) => {
  const { username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin } = req.body;

  if (!username || !email || !password || !id_role) {
    return res.status(400).json({ error: 'Username, email, password, dan role wajib diisi!' });
  }

  try {
    const check = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Username atau email sudah digunakan!' });

    const insertQuery = `
      INSERT INTO users (username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, id_role
    `;
    const result = await db.query(insertQuery, [username, email, password, nama_lengkap || username, id_role, tanggal_lahir || null, jenis_kelamin || null]);
    res.status(201).json({ message: 'User berhasil ditambahkan!', user: result.rows[0] });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
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

// Delete role
router.delete('/roles/:id', async (req, res) => {
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

// Update user
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin } = req.body;

  try {
    let query, values;
    if (password) {
      query = 'UPDATE users SET username=$1, email=$2, password=$3, nama_lengkap=$4, id_role=$5, tanggal_lahir=$6, jenis_kelamin=$7 WHERE id=$8 RETURNING id, username';
      values = [username, email, password, nama_lengkap || username, id_role, tanggal_lahir || null, jenis_kelamin || null, id];
    } else {
      query = 'UPDATE users SET username=$1, email=$2, nama_lengkap=$3, id_role=$4, tanggal_lahir=$5, jenis_kelamin=$6 WHERE id=$7 RETURNING id, username';
      values = [username, email, nama_lengkap || username, id_role, tanggal_lahir || null, jenis_kelamin || null, id];
    }

    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
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
