import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { afterEach, describe, expect, test } from "vitest";
import { migrateReadingSnapshotFile } from "./reading-snapshot-migration";

const tempDirs: string[] = [];

describe("reading snapshot migration", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  test("imports readings.json into the configured snapshot store", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reading-snapshot-migration-"));
    tempDirs.push(dir);
    const filePath = join(dir, "readings.json");
    const payload = { readings: [{ id: "reading_1" }], casts: [] };
    await writeFile(filePath, JSON.stringify(payload), "utf8");
    const saved: unknown[] = [];

    const result = await migrateReadingSnapshotFile(filePath, {
      save: async (_scope, snapshot) => {
        saved.push(snapshot);
      },
    });

    expect(result).toEqual({ migrated: true, scope: "reading-service" });
    expect(saved).toEqual([payload]);
  });

  test("rejects invalid JSON before writing to the snapshot store", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reading-snapshot-migration-"));
    tempDirs.push(dir);
    const filePath = join(dir, "readings.json");
    await writeFile(filePath, "{not-json", "utf8");
    let wrote = false;

    await expect(
      migrateReadingSnapshotFile(filePath, {
        save: async () => {
          wrote = true;
        },
      }),
    ).rejects.toThrow("Invalid reading snapshot JSON");
    expect(wrote).toBe(false);
  });
});
