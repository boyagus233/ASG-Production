const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '@Naruto233',
  port: 2002,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
