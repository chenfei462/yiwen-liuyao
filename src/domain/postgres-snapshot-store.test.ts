import { afterEach, describe, expect, test, vi } from "vitest";
import { createPostgresSnapshotStore, resolveDatabaseUrl } from "./postgres-snapshot-store";

describe("postgres snapshot store", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("upserts and loads JSONB snapshots by scope", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const query = async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("SELECT payload")) {
        return { rows: [{ payload: { readings: [{ id: "reading_1" }] } }] };
      }
      return { rows: [] };
    };
    const store = createPostgresSnapshotStore({ query });

    await store.save("reading-service", { readings: [{ id: "reading_1" }] });
    const payload = await store.load("reading-service");

    expect(payload).toEqual({ readings: [{ id: "reading_1" }] });
    expect(calls.some((call) => call.sql.includes("CREATE TABLE IF NOT EXISTS domain_snapshots"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("ON CONFLICT (scope) DO UPDATE"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("SELECT payload"))).toBe(true);
  });

  test("requires DATABASE_URL in production but allows local memory fallback outside production", async () => {
    expect(() => resolveDatabaseUrl({ NODE_ENV: "production" })).toThrow("DATABASE_URL is required");
    expect(resolveDatabaseUrl({ NODE_ENV: "development" })).toBeNull();
    expect(resolveDatabaseUrl({ NODE_ENV: "production", DATABASE_URL: "postgres://example" })).toBe("postgres://example");
  });

  test("defers production DATABASE_URL validation until the first store operation", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");

    const store = createPostgresSnapshotStore();

    await expect(store.load("reading-service")).rejects.toThrow("DATABASE_URL is required");
  });
});
