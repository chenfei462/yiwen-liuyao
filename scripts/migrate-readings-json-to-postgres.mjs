#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;
const filePath = resolve(process.argv[2] ?? ".data/readings.json");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to migrate readings.json");
  process.exit(1);
}

const raw = await readFile(filePath, "utf8");
const payload = JSON.parse(raw);
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS domain_snapshots (
      scope TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(
    `
      INSERT INTO domain_snapshots (scope, payload, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (scope) DO UPDATE
      SET payload = EXCLUDED.payload,
          updated_at = now()
    `,
    ["reading-service", JSON.stringify(payload)],
  );
  console.log(`Migrated ${filePath} to domain_snapshots.reading-service`);
} finally {
  await pool.end();
}
