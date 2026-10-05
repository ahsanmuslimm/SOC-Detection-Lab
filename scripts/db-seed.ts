/**
 * Database Seed Runner
 *
 * Applies SQL seed files from database/seeds in filename order. Unlike
 * migrations, seeds are not tracked — running them twice may duplicate
 * seed rows unless the SQL is idempotent (ON CONFLICT clauses).
 *
 * Usage:
 *   npm run db:seed
 *
 * @module scripts/db-seed
 */

import { Client } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SEEDS_DIR = join(process.cwd(), 'database', 'seeds');

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'soc'}:${process.env.DB_PASSWORD || 'soc'}@${
    process.env.DB_HOST || 'localhost'
  }:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'soclab'}`;

async function runSeeds(): Promise<void> {
  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();

    const files = readdirSync(SEEDS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(SEEDS_DIR, file), 'utf-8');
      console.log(`▶ applying seed ${file}...`);
      await client.query(sql);
      console.log(`✓ applied ${file}`);
    }

    console.log('\n✓ Seed complete');
  } finally {
    await client.end();
  }
}

runSeeds().catch(error => {
  console.error('✗ Seed failed:', error.message);
  process.exit(1);
});
