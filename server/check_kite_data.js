const { pool } = require('./src/db/pool');

async function check() {
  try {
    const creds = await pool.query('SELECT * FROM kite_credentials');
    const sessions = await pool.query('SELECT * FROM kite_sessions');
    console.log('Kite Credentials:', creds.rowCount);
    console.log('Kite Sessions:', sessions.rowCount);
    
    if (creds.rowCount > 0) {
      console.log('Sample Cred:', creds.rows[0]);
    }
    if (sessions.rowCount > 0) {
      console.log('Sample Session:', sessions.rows[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
