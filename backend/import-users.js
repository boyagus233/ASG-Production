const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('./db');

const csvFile = `C:\\Users\\yamada\\.gemini\\antigravity-ide\\brain\\717439cb-1e55-4c2b-b720-1881504c2893\\.system_generated\\steps\\1876\\content.md`;

async function main() {
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n');
  
  // Find start of data
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Timestamp,Nama lengkap')) {
      startIndex = i + 1;
      break;
    }
  }

  const usersToInsert = [];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Some lines might have the line number prefix from view_file if I copied incorrectly, but this is the raw file, so no prefix.
    const parts = line.split(',');
    if (parts.length < 7) continue;

    const [timestamp, nama_lengkap, username, email, tgl_lahir_str, jenis_kelamin, role] = parts;
    usersToInsert.push({ nama_lengkap, username, email, tgl_lahir_str, jenis_kelamin, role });
  }

  for (const u of usersToInsert) {
    // 1. Get or Create Role
    let roleId;
    const roleCheck = await db.query('SELECT id FROM roles WHERE role_name = $1', [u.role]);
    if (roleCheck.rows.length > 0) {
      roleId = roleCheck.rows[0].id;
    } else {
      const roleInsert = await db.query('INSERT INTO roles (role_name) VALUES ($1) RETURNING id', [u.role]);
      roleId = roleInsert.rows[0].id;
      console.log(`Created new role: ${u.role}`);
    }

    // 2. Parse date (DD/MM/YYYY)
    let tgl_lahir = null;
    if (u.tgl_lahir_str) {
      const [dd, mm, yyyy] = u.tgl_lahir_str.split('/');
      tgl_lahir = `${yyyy}-${mm}-${dd}`;
    }

    // 3. Default password (e.g. 123456)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 4. Insert User
    try {
      const userCheck = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [u.username, u.email]);
      if (userCheck.rows.length > 0) {
        console.log(`User ${u.username} already exists, skipping...`);
        continue;
      }

      await db.query(`
        INSERT INTO users (username, email, password, nama_lengkap, id_role, tanggal_lahir, jenis_kelamin)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [u.username, u.email, hashedPassword, u.nama_lengkap, roleId, tgl_lahir, u.jenis_kelamin]);
      
      console.log(`Inserted user: ${u.username}`);
    } catch (err) {
      console.error(`Failed to insert user ${u.username}:`, err.message);
    }
  }

  console.log('Import completed.');
  process.exit(0);
}

main();
