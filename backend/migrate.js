const db = require('./db');

async function migrate() {
  try {
    console.log('Menambahkan kolom tanggal_lahir dan jenis_kelamin...');
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);`);
    console.log('Migrasi berhasil!');
  } catch (err) {
    console.error('Migrasi gagal:', err);
  } finally {
    process.exit();
  }
}

migrate();
