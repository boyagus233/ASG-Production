const db = require('./db');

async function migrateChat() {
  try {
    console.log('Membuat tabel arsitektur Group Chat & Audit Log...');
    
    // 1. Audit Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Groups
    await db.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 3. Group Members
    await db.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      );
    `);
    
    // 4. Messages
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT,
        attachment_url TEXT,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migrasi Chat berhasil!');
  } catch (err) {
    console.error('Migrasi Chat gagal:', err);
  } finally {
    process.exit();
  }
}

migrateChat();
