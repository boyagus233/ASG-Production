const db = require('./db');
db.query("UPDATE users SET password = 'admin' WHERE username = 'admin'")
  .then(() => { console.log('Password reset to admin'); process.exit(); })
  .catch(console.error);
