const fs = require('node:fs');
const path = require('node:path');

const { pool } = require('./pool');

const MIGRATIONS_TABLE = '_schema_migrations';

function parseArgs(argv) {
  return {
    reset: argv.includes('--reset')
  };
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrationSet(client) {
  const { rows } = await client.query(`SELECT filename FROM ${MIGRATIONS_TABLE};`);
  return new Set(rows.map((r) => r.filename));
}

function listMigrationFiles(migrationsDir) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.sql'))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
}

async function applyOneMigration(client, migrationsDir, filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1);`, [filename]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    err.message = `Migration failed (${filename}): ${err.message}`;
    throw err;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const migrationsDir = path.resolve(__dirname, 'migrations');

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    if (args.reset) {
      await client.query(`TRUNCATE TABLE ${MIGRATIONS_TABLE};`);
      // Note: this does NOT drop your schema, it only forgets applied migration history.
      // Re-running non-idempotent migrations may fail.
      // This flag exists mostly for local/dev experimentation.
      // (Your migration SQL should prefer IF NOT EXISTS where possible.)
    }

    const applied = await getAppliedMigrationSet(client);
    const files = listMigrationFiles(migrationsDir);

    let appliedCount = 0;
    for (const filename of files) {
      if (applied.has(filename)) continue;
      console.log(`Applying ${filename}...`);
      await applyOneMigration(client, migrationsDir, filename);
      appliedCount += 1;
    }

    console.log(`Done. Applied ${appliedCount} migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
