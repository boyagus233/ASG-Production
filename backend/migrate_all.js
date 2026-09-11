const db = require('./db');

async function migrateAll() {
  console.log('🚀 Memulai migrasi database ke Supabase...');
  try {
    // 1. Roles
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE
      );
    `);
    await db.query(`INSERT INTO roles (role_name) VALUES ('Admin'), ('Anggota') ON CONFLICT DO NOTHING;`);
    console.log('✅ 1/7 Tabel roles & data default siap.');

    // 2. Users
    await db.query(`
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
    `);
    const roleResult = await db.query("SELECT id FROM roles WHERE role_name = 'Admin'");
    if (roleResult.rows.length > 0) {
      const adminRoleId = roleResult.rows[0].id;
      await db.query(`
        INSERT INTO users (username, nama_lengkap, email, password, id_role) 
        VALUES ('admin', 'Administrator', 'admin@asgproduction.com', 'admin', $1)
        ON CONFLICT (username) DO NOTHING;
      `, [adminRoleId]);
    }
    console.log('✅ 2/7 Tabel users & user Admin siap.');

    // 3. Audit Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ 3/7 Tabel audit_logs siap.');

    // 4. Groups & Group Members
    await db.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      );
    `);
    console.log('✅ 4/7 Tabel groups & group_members siap.');

    // 5. Messages
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
    console.log('✅ 5/7 Tabel messages siap.');

    // 6. Job Invitations & History
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
    console.log('✅ 6/7 Tabel job_invitations & group_history siap.');

    // 7. Notifications & Push Tokens
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
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        push_token TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ 7/7 Tabel notifications & user_push_tokens siap.');

    console.log('🎉 MIGRASI KE SUPABASE BERHASIL 100%! SEMUA TABEL TERDAPAT PADA CLOUD DATABASE.');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    process.exit();
  }
}

migrateAll();
