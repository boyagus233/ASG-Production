const { Client } = require('pg');

async function setupDB() {
  const client = new Client({
    user: 'postgres',
    password: '@Naruto233', // Password yang diberikan user
    host: 'localhost',
    port: 2002,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Berhasil terhubung ke database PostgreSQL di port 2002!');

    // Coba jalankan query pembuatan tabel
    const query = `
      -- 1. Tabel Role
      CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          role_name VARCHAR(50) NOT NULL UNIQUE
      );

      -- Masukkan data jika belum ada
      INSERT INTO roles (role_name) VALUES ('Admin'), ('Anggota') ON CONFLICT DO NOTHING;

      -- 2. Tabel Users
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          nama_lengkap VARCHAR(100) NOT NULL,
          tanggal_lahir DATE,
          jenis_kelamin VARCHAR(20),
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          id_role INT REFERENCES roles(id) DEFAULT 2,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(query);
    console.log('Tabel roles dan users berhasil dibuat/dicek keberadaannya!');

    // 3. Tambahkan User Admin
    // Kita cari id_role untuk 'Admin' terlebih dahulu
    const roleResult = await client.query("SELECT id FROM roles WHERE role_name = 'Admin'");
    const adminRoleId = roleResult.rows[0].id;

    const insertAdminQuery = `
      INSERT INTO users (username, nama_lengkap, email, password, id_role) 
      VALUES ('admin', 'Administrator', 'admin@asgproduction.com', 'admin', $1)
      ON CONFLICT (username) DO NOTHING;
    `;
    await client.query(insertAdminQuery, [adminRoleId]);
    console.log('User admin berhasil dibuat (jika belum ada). Username: admin, Password: admin');

  } catch (error) {
    console.error('Terjadi kesalahan saat mengeksekusi database:', error.message);
  } finally {
    await client.end();
  }
}

setupDB();
