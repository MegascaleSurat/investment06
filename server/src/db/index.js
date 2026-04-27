const { pool } = require('./pool');
const { query } = require('./query');
const { withTransaction } = require('./transaction');

async function closeDb() {
  await pool.end();
}

module.exports = { pool, query, withTransaction, closeDb };

