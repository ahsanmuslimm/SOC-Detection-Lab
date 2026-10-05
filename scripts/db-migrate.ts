/**
 * Database Migration Runner
 *
 * Applies raw SQL migrations from database/migrations/ in filename order.
 * Tracks applied files in the schema_migrations table — fully idempotent,
 * safe to run multiple times.
 *
 * Usage:
 *   npm run db:migrate
 */

import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseClient } from '../src/backend/database/client';

const MIGRATIONS_DIR = join(process.cwd(), 'database', 'migrations');

async function runMigrations(): Promise<void> {
  const db = DatabaseClient.getInstance();

  // Tracking table — safe to call repeatedly
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Which files have already been applied?
  const applied = new Set(
    (await db.query<{ filename: string }>('SELECT filename FROM schema_migrations'))
      .map(r => r.filename)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let executed = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }

    console.log(`  apply ${file} …`);
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

    // Run migration + tracking insert in one transaction
    await db.transaction(async (client) => {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
    });

    console.log(`  done  ${file}`);
    executed++;
  }

  console.log(`\nMigrations complete — ${executed} applied, ${applied.size} skipped.`);
  await db.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', (err as Error).message);
  process.exit(1);
});
