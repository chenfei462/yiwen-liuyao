import { readFile } from "fs/promises";
import { createPostgresSnapshotStore, READING_SNAPSHOT_SCOPE, type SnapshotStore } from "./postgres-snapshot-store";

export type ReadingSnapshotMigrationResult = {
  migrated: true;
  scope: typeof READING_SNAPSHOT_SCOPE;
};

export async function migrateReadingSnapshotFile(
  filePath: string,
  store: Pick<SnapshotStore, "save"> = createPostgresSnapshotStore(),
): Promise<ReadingSnapshotMigrationResult> {
  const contents = await readFile(filePath, "utf8");
  let snapshot: unknown;
  try {
    snapshot = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Invalid reading snapshot JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  await store.save(READING_SNAPSHOT_SCOPE, snapshot);
  return { migrated: true, scope: READING_SNAPSHOT_SCOPE };
}
