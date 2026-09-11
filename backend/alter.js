const db = require('./db');
db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS payload TEXT;')
  .then(() => console.log('Payload column added!'))
  .catch(console.error)
  .finally(() => process.exit());
