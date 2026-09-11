const { Pool } = require('pg');
require('dotenv').config();
const { sendPushNotification } = require('./firebase');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: '@Naruto233',
        port: 2002,
      }
);

async function testPush() {
  try {
    const result = await pool.query('SELECT push_token FROM user_push_tokens WHERE push_token IS NOT NULL');
    const tokens = result.rows.map(row => row.push_token);
    
    if (tokens.length === 0) {
      console.log('Tidak ada token push yang terdaftar di database.');
      process.exit(0);
    }

    console.log(`Mengirim test push ke ${tokens.length} perangkat...`);
    
    await sendPushNotification(
      tokens,
      "🚨 TEST NOTIFIKASI PWA",
      "Ini adalah pesan uji coba dari sistem ASG Production. Jika ini yang kamu lihat tadi, berarti sistem aman!",
      { type: "test" }
    );
    
    console.log('Test notifikasi selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Gagal mengirim test push:', error);
    process.exit(1);
  }
}

testPush();
