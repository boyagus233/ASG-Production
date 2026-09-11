const db = require('./db');

async function run() {
  try {
    console.log('Running migration...');
    // 1. Alter users table
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS no_hp VARCHAR(50);
    `);
    console.log('Users table updated with avatar_url & no_hp');

    // 2. Alter groups table
    await db.query(`
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS call_time VARCHAR(20);
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS show_time VARCHAR(20);
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS venue_address TEXT;
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS dresscode TEXT;
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS rundown_notes TEXT;
    `);
    console.log('Groups table updated with briefing fields');

    // 3. Create job_checklists table
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_checklists (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'ALAT',
        is_checked BOOLEAN DEFAULT FALSE,
        checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_job_checklists_group_id ON job_checklists(group_id);
    `);
    console.log('job_checklists table and index ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
