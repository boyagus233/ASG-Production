const { Pool, types } = require('pg');
require('dotenv').config();

// Fix Timezone Issue: Treat PostgreSQL TIMESTAMP without timezone as UTC
types.setTypeParser(1114, str => new Date(str + 'Z'));

// Konfigurasi otomatis: Gunakan DATABASE_URL (Supabase/Render) jika ada, atau fallback ke Lokal
const isProduction = !!process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Wajib untuk Supabase / Cloud Postgres
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || '@Naruto233',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 2002,
      }
);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
