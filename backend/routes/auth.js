const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_asg_production';

// Endpoint Signup / Register
router.post('/signup', async (req, res) => {
  const { username, email, password, nama_lengkap, tanggal_lahir, jenis_kelamin } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, dan password wajib diisi!' });
  }

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username atau email sudah terdaftar!' });
    }

    const hashedPassword = password;

    const roleResult = await db.query("SELECT id FROM roles WHERE role_name = 'Anggota'");
    const roleId = roleResult.rows[0].id;

    const insertQuery = `
      INSERT INTO users (username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, id_role
    `;
    const result = await db.query(insertQuery, [username, email, hashedPassword, nama_lengkap || username, roleId, tanggal_lahir || null, jenis_kelamin || null]);

    res.status(201).json({ message: 'User berhasil didaftarkan!', user: result.rows[0] });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Endpoint Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // email bisa berisi email atau username

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Username dan password wajib diisi!' });
  }

  try {
    // 1. Cari user berdasarkan email ATAU username
    const userResult = await db.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Kredensial tidak valid!' });
    }

    const user = userResult.rows[0];

    // 2. Verifikasi password 
    // (Jika pakai bcrypt: const isMatch = await bcrypt.compare(password, user.password); )
    const isMatch = (password === user.password); 

    if (!isMatch) {
      return res.status(401).json({ error: 'Kredensial tidak valid!' });
    }

    // 3. Buat JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.id_role },
      JWT_SECRET,
      { expiresIn: '1d' } // token berlaku 1 hari
    );

    res.json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        id_role: user.id_role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
