import { Pool } from "pg";

export const READING_SNAPSHOT_SCOPE = "reading-service";

type QueryResult = {
  rows: Array<{ payload?: unknown }>;
};

type QueryExecutor = (sql: string, params?: unknown[]) => Promise<QueryResult>;

export type SnapshotStore = {
  load(scope: string): Promise<unknown | null>;
  save(scope: string, payload: unknown): Promise<void>;
};

type SnapshotStoreOptions = {
  databaseUrl?: string | null;
  query?: QueryExecutor;
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS domain_snapshots (
  scope TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export function resolveDatabaseUrl(env: Partial<Pick<NodeJS.ProcessEnv, "DATABASE_URL" | "NODE_ENV">> = process.env): string | null {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (databaseUrl) return databaseUrl;
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required for production reading persistence");
  }
  return null;
}

export function createPostgresSnapshotStore(options: SnapshotStoreOptions = {}): SnapshotStore {
  const query = options.query ?? createLazyPoolQuery(options.databaseUrl);
  let tableReady = false;

  async function ensureTable(): Promise<void> {
    if (tableReady) return;
    await query(CREATE_TABLE_SQL);
    tableReady = true;
  }

  return {
    async load(scope) {
      await ensureTable();
      const result = await query("SELECT payload FROM domain_snapshots WHERE scope = $1", [scope]);
      return result.rows[0]?.payload ?? null;
    },
    async save(scope, payload) {
      await ensureTable();
      await query(
        `
INSERT INTO domain_snapshots (scope, payload, updated_at)
VALUES ($1, $2::jsonb, now())
ON CONFLICT (scope) DO UPDATE
SET payload = EXCLUDED.payload,
    updated_at = now()`,
        [scope, JSON.stringify(payload)],
      );
    },
  };
}

function createLazyPoolQuery(databaseUrl: string | null | undefined): QueryExecutor {
  let query: QueryExecutor | null = null;

  return async (sql, params) => {
    query ??= createPoolQuery(databaseUrl ?? resolveDatabaseUrl());
    return query(sql, params);
  };
}

function createPoolQuery(databaseUrl: string | null): QueryExecutor {
  if (!databaseUrl) return async () => ({ rows: [] });
  const pool = new Pool({ connectionString: databaseUrl });
  return async (sql, params) => pool.query(sql, params);
}
