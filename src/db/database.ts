import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (db === null) {
    db = SQLite.openDatabaseSync('its-a-rock.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boulder_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gym_id INTEGER NOT NULL,
      photo_asset_id TEXT,
      photo_uri TEXT,
      photo_width INTEGER,
      photo_height INTEGER,
      grade TEXT NOT NULL DEFAULT 'VB',
      attempts INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      climbed_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS route_tags (
      route_id INTEGER NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (route_id, tag_id),
      FOREIGN KEY (route_id) REFERENCES boulder_routes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_boulder_routes_climbed_at
      ON boulder_routes (climbed_at);

    CREATE INDEX IF NOT EXISTS idx_boulder_routes_gym_id
      ON boulder_routes (gym_id);

    CREATE INDEX IF NOT EXISTS idx_boulder_routes_completed
      ON boulder_routes (completed);

    CREATE INDEX IF NOT EXISTS idx_route_tags_tag_id
      ON route_tags (tag_id);
  `);

  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(boulder_routes)');
  if (!columns.some((column) => column.name === 'grade')) {
    await database.execAsync("ALTER TABLE boulder_routes ADD COLUMN grade TEXT NOT NULL DEFAULT 'VB'");
  }
}
