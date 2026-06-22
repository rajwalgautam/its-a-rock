import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (db === null) {
    db = SQLite.openDatabaseSync('its-a-rock.db');
  }
  return db;
}

/**
 * Create the schema idempotently. Safe to call on every boot.
 * See docs/BLUEPRINT.md §4.1.
 */
export async function initDatabase(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gyms (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      normalized_name TEXT    NOT NULL UNIQUE,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT,
      gym_id        INTEGER NOT NULL REFERENCES gyms(id),
      photo_uri     TEXT,
      photo_width   INTEGER,
      photo_height  INTEGER,
      grade         TEXT,
      completed     INTEGER NOT NULL DEFAULT 0,
      notes         TEXT,
      started_at    INTEGER,
      completed_at  INTEGER,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_routes_gym       ON routes (gym_id);
    CREATE INDEX IF NOT EXISTS idx_routes_completed ON routes (completed);
    CREATE INDEX IF NOT EXISTS idx_routes_created   ON routes (created_at);
  `);
  await runMigrations(database);
}

/** Latest schema version; bump and add a branch in runMigrations per change. */
const LATEST_SCHEMA_VERSION = 1;

/**
 * Apply pending schema migrations, tracked by SQLite's `user_version`. Fresh
 * installs start at 0 (default) and run every migration; the steps are written
 * to be idempotent so re-running is harmless.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version < 1) {
    await migrateToV1(db);
    version = 1;
  }

  if (version !== LATEST_SCHEMA_VERSION) version = LATEST_SCHEMA_VERSION;
  // PRAGMA can't be parameterized; the value is a trusted integer constant.
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

/** v1: introduce the one-to-many `route_media` gallery and backfill covers. */
async function migrateToV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS route_media (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id   INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      uri        TEXT    NOT NULL,
      type       TEXT    NOT NULL DEFAULT 'photo',
      width      INTEGER,
      height     INTEGER,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_route_media_route ON route_media (route_id, position);
  `);

  // Backfill: every existing single photo becomes the first gallery item. The
  // NOT EXISTS guard keeps this safe to re-run.
  await db.runAsync(
    `INSERT INTO route_media (route_id, uri, type, width, height, position, created_at)
       SELECT id, photo_uri, 'photo', photo_width, photo_height, 0, ?
       FROM routes
       WHERE photo_uri IS NOT NULL AND photo_uri != ''
         AND NOT EXISTS (SELECT 1 FROM route_media m WHERE m.route_id = routes.id)`,
    [Date.now()],
  );
}
