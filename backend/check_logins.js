const db = require('./db');

async function checkLogins() {
  try {
    const res = await db.query(`
      SELECT u.username, u.nama_lengkap, t.updated_at as last_login
      FROM users u
      JOIN user_push_tokens t ON u.id = t.user_id
      ORDER BY t.updated_at DESC
    `);
    
    if (res.rows.length === 0) {
      console.log("Belum ada user yang login dan mendaftarkan token.");
    } else {
      console.log("User yang sudah login:");
      console.table(res.rows);
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkLogins();
