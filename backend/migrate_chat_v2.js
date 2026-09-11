const db = require('./db');

async function migrateChatV2() {
  try {
    console.log('Starting Chat V2 Migration...');

    // 1. Table Message Reactions
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INT REFERENCES messages(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      );
    `);

    // 2. Table Pinned Messages
    await db.query(`
      CREATE TABLE IF NOT EXISTS pinned_messages (
        group_id INT PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
        message_id INT REFERENCES messages(id) ON DELETE CASCADE,
        pinned_by INT REFERENCES users(id) ON DELETE CASCADE,
        pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table Message Reads (For Double Blue Checkmarks)
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        message_id INT REFERENCES messages(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(message_id, user_id)
      );
    `);

    // 4. Alter messages table for edit flags
    await db.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
    `);

    console.log('✅ Chat V2 Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateChatV2();
