const db = require('./db');

async function migrateJobs() {
  try {
    console.log('Membuat tabel arsitektur Job Invitations, History, & Notifications...');

    // 1. Tabel Undangan Job (Accept / Reject)
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_invitations (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      );
    `);

    // 2. Tabel Riwayat Job / Grup yang Sudah Selesai/Dihapus
    await db.query(`
      CREATE TABLE IF NOT EXISTS group_history (
        id SERIAL PRIMARY KEY,
        original_group_id INTEGER,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        member_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'SELESAI',
        created_at TIMESTAMP,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabel Notifikasi
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabel Token Push Notification Device
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        push_token TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migrasi Tabel Job, History & Notifikasi BERHASIL!');
  } catch (error) {
    console.error('Migrasi Gagal:', error);
  } finally {
    process.exit();
  }
}

migrateJobs();
