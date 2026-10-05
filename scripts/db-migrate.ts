/**
 * Database Migration Runner
 *
 * Applies raw SQL migrations from database/migrations in filename order,
 * tracking applied files in the schema_migrations table. Idempotent —
 * already-applied migrations are skipped.
 *
 * Usage:
 *   npm run db:migrate
 *   node scripts/db-migrate.ts            (tsx)
 *
 * @module scripts/db-migrate
 */

import { Client } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS_DIR = join(process.cwd(), 'database', 'migrations');

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'soc'}:${process.env.DB_PASSWORD || 'soc'}@${
    process.env.DB_HOST || 'localhost'
  }:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'soclab'}`;

async function runMigrations(): Promise<void> {
  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT UNIQUE NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(rows.map(row => row.filename));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let executed = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`↷ skipped ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`▶ applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        executed += 1;
        console.log(`✓ applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
      }
    }

    console.log(`\n✓ Migration complete — ${executed} applied, ${applied.size} skipped`);
  } finally {
    await client.end();
  }
}

runMigrations().catch(error => {
  console.error('✗ Migration failed:', error.message);
  process.exit(1);
});
