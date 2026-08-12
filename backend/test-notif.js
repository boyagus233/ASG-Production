const db = require('./db');
const { sendPushNotification } = require('./firebase');

async function testNotif() {
  try {
    console.log('Mengambil token asli dari database...');
    const result = await db.query('SELECT push_token FROM user_push_tokens');
    const tokens = result.rows.map(r => r.push_token).filter(t => t !== 'token-bohong-123');
    
    if (tokens.length === 0) {
      console.log('Tidak ada token asli di database!');
      process.exit(1);
    }
    
    console.log(`Ditemukan ${tokens.length} token asli. Mengirim notifikasi...`);
    await sendPushNotification(
      tokens,
      'TEST NOTIFIKASI BERHASIL! 🎉',
      'Ini adalah bukti bahwa notifikasi dari server masuk ke HP kamu seperti notifikasi WA!',
      { type: 'test' }
    );
    
    console.log('Selesai menguji Firebase!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testNotif();
