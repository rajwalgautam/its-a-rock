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
}
