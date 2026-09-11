const bcrypt = require('bcrypt');
const db = require('./db');

async function secureAdminPassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin', salt);
    await db.query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin']);
    console.log('Successfully hashed admin password into bcrypt!');
    process.exit(0);
  } catch (err) {
    console.error('Error hashing admin password:', err);
    process.exit(1);
  }
}

secureAdminPassword();
