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
const LATEST_SCHEMA_VERSION = 5;

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

  if (version < 2) {
    await migrateToV2(db);
    version = 2;
  }

  if (version < 3) {
    await migrateToV3(db);
    version = 3;
  }

  if (version < 4) {
    await migrateToV4(db);
    version = 4;
  }

  if (version < 5) {
    await migrateToV5(db);
    version = 5;
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

/**
 * v2: the route planner. `route_plans` is one ordered sequence of moves drawn on
 * a photo; `plan_moves` is each placement (one limb to one spot). `hold_id` is a
 * soft reference to the (later) `route_holds` table — intentionally no FK so the
 * planner ships independently of hold detection.
 */
async function migrateToV2(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS route_plans (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id   INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      media_id   INTEGER REFERENCES route_media(id) ON DELETE SET NULL,
      name       TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plan_moves (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id    INTEGER NOT NULL REFERENCES route_plans(id) ON DELETE CASCADE,
      limb       TEXT    NOT NULL,
      hold_id    INTEGER,
      x          REAL    NOT NULL,
      y          REAL    NOT NULL,
      sequence   INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_route_plans_route ON route_plans (route_id);
    CREATE INDEX IF NOT EXISTS idx_plan_moves_plan   ON plan_moves (plan_id, sequence);
  `);
}

/**
 * v3: grouped frames. A nullable `group_id` on `plan_moves` lets several
 * placements share one frame (limbs that move simultaneously); a null id is a
 * solo move (the pre-v3 behaviour). No FK — ids are only unique within a plan.
 * `ADD COLUMN` isn't idempotent, so guard on the existing columns.
 */
async function migrateToV3(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plan_moves)');
  if (!cols.some((c) => c.name === 'group_id')) {
    await db.execAsync('ALTER TABLE plan_moves ADD COLUMN group_id INTEGER');
  }
}

/**
 * v5: "floating" markers. A boolean `floating` on `plan_moves` lets a climber
 * grey out an optional/uncommitted hold (a smear, a foot they might skip)
 * without deleting it. Purely a visual annotation — sequence, grouping, and
 * playback are unaffected. Defaults to 0 so existing moves load unchanged.
 * `ADD COLUMN` isn't idempotent, so guard on the existing columns.
 */
async function migrateToV5(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plan_moves)');
  if (!cols.some((c) => c.name === 'floating')) {
    await db.execAsync('ALTER TABLE plan_moves ADD COLUMN floating INTEGER NOT NULL DEFAULT 0');
  }
}

/**
 * v4: notes become first-class entries. `route_notes` holds many notes per
 * route, each with optional `media_id` (a `route_media` row it's attached to,
 * null for text-only) and an optional move plan. Plans gain a nullable
 * `note_id` so "plan this move" attaches to a note's media instead of the whole
 * route. The legacy `routes.notes` column is kept and backfilled into one note
 * per route. `ADD COLUMN` isn't idempotent, so guard on the existing columns.
 */
async function migrateToV4(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS route_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id   INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      media_id   INTEGER REFERENCES route_media(id) ON DELETE SET NULL,
      body       TEXT,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_route_notes_route ON route_notes (route_id, position);
  `);

  const planCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(route_plans)');
  if (!planCols.some((c) => c.name === 'note_id')) {
    await db.execAsync('ALTER TABLE route_plans ADD COLUMN note_id INTEGER');
  }

  // Backfill: every existing single note string becomes the first note entry.
  // The NOT EXISTS guard keeps this safe to re-run.
  await db.runAsync(
    `INSERT INTO route_notes (route_id, media_id, body, position, created_at, updated_at)
       SELECT id, NULL, notes, 0, ?, ?
       FROM routes
       WHERE notes IS NOT NULL AND notes != ''
         AND NOT EXISTS (SELECT 1 FROM route_notes n WHERE n.route_id = routes.id)`,
    [Date.now(), Date.now()],
  );

  await rehomeLegacyPlans(db);
}

/**
 * Pre-v4 plans were anchored to a route + photo with no note. The new UI only
 * reaches a plan through its note, so re-home each orphaned plan onto a note:
 * claim the route's first media-less note (combining the backfilled text with
 * the planned photo) when one exists, otherwise create a note for it. Plan
 * moves are left untouched. Idempotent — only plans still missing a note_id are
 * considered, so a second run finds none.
 */
async function rehomeLegacyPlans(db: SQLite.SQLiteDatabase): Promise<void> {
  const orphans = await db.getAllAsync<{ id: number; route_id: number; media_id: number }>(
    `SELECT id, route_id, media_id FROM route_plans
       WHERE note_id IS NULL AND media_id IS NOT NULL`,
  );
  for (const plan of orphans) {
    const now = Date.now();
    // Prefer an existing note with no media and no plan of its own.
    const free = await db.getFirstAsync<{ id: number }>(
      `SELECT n.id FROM route_notes n
         WHERE n.route_id = ? AND n.media_id IS NULL
           AND NOT EXISTS (SELECT 1 FROM route_plans p WHERE p.note_id = n.id)
         ORDER BY n.position ASC LIMIT 1`,
      [plan.route_id],
    );
    let noteId: number;
    if (free !== null) {
      await db.runAsync('UPDATE route_notes SET media_id = ?, updated_at = ? WHERE id = ?', [
        plan.media_id,
        now,
        free.id,
      ]);
      noteId = free.id;
    } else {
      const nextPos = await db.getFirstAsync<{ pos: number }>(
        'SELECT COALESCE(MAX(position) + 1, 0) AS pos FROM route_notes WHERE route_id = ?',
        [plan.route_id],
      );
      const result = await db.runAsync(
        `INSERT INTO route_notes (route_id, media_id, body, position, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?)`,
        [plan.route_id, plan.media_id, nextPos?.pos ?? 0, now, now],
      );
      noteId = result.lastInsertRowId;
    }
    await db.runAsync('UPDATE route_plans SET note_id = ? WHERE id = ?', [noteId, plan.id]);
  }
}
