import { getDatabase } from './database';
import { formatGymName, normalizeGymName } from '@/utils/gymUtils';
import type { Gym, RouteFilters, RouteInput, RouteWithGym } from '@/types';

interface GymRow {
  id: number;
  name: string;
  normalized_name: string;
  created_at: number;
  updated_at: number;
}

interface RouteJoinRow {
  id: number;
  name: string | null;
  gym_id: number;
  photo_uri: string | null;
  photo_width: number | null;
  photo_height: number | null;
  grade: string | null;
  completed: number;
  notes: string | null;
  started_at: number | null;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
  gym_name: string;
  gym_normalized_name: string;
  gym_created_at: number;
  gym_updated_at: number;
}

const ROUTE_SELECT = `
  SELECT
    r.id, r.name, r.gym_id, r.photo_uri, r.photo_width, r.photo_height,
    r.grade, r.completed, r.notes, r.started_at, r.completed_at,
    r.created_at, r.updated_at,
    g.name            AS gym_name,
    g.normalized_name AS gym_normalized_name,
    g.created_at      AS gym_created_at,
    g.updated_at      AS gym_updated_at
  FROM routes r
  JOIN gyms g ON g.id = r.gym_id
`;

function mapGym(row: GymRow): Gym {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoute(row: RouteJoinRow): RouteWithGym {
  return {
    id: row.id,
    name: row.name,
    gymId: row.gym_id,
    photoUri: row.photo_uri,
    photoWidth: row.photo_width,
    photoHeight: row.photo_height,
    grade: row.grade,
    completed: row.completed === 1,
    notes: row.notes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    gym: {
      id: row.gym_id,
      name: row.gym_name,
      normalizedName: row.gym_normalized_name,
      createdAt: row.gym_created_at,
      updatedAt: row.gym_updated_at,
    },
  };
}

/**
 * Resolve a gym by its normalized name, creating it if absent. Returns the
 * gym id. The display name is refreshed on hit so the latest casing wins.
 */
async function upsertGym(gymName: string, now: number): Promise<number> {
  const db = getDatabase();
  const display = formatGymName(gymName);
  const normalized = normalizeGymName(gymName);

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM gyms WHERE normalized_name = ?',
    [normalized],
  );
  if (existing !== null) {
    await db.runAsync('UPDATE gyms SET name = ?, updated_at = ? WHERE id = ?', [
      display,
      now,
      existing.id,
    ]);
    return existing.id;
  }

  const result = await db.runAsync(
    'INSERT INTO gyms (name, normalized_name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [display, normalized, now, now],
  );
  return result.lastInsertRowId;
}

async function getRouteByIdOrThrow(id: number): Promise<RouteWithGym> {
  const route = await getRouteById(id);
  if (route === null) throw new Error(`Route ${id} not found after write`);
  return route;
}

export async function createRoute(input: RouteInput): Promise<RouteWithGym> {
  const db = getDatabase();
  const now = Date.now();
  const gymId = await upsertGym(input.gymName, now);
  const result = await db.runAsync(
    `INSERT INTO routes
       (name, gym_id, photo_uri, photo_width, photo_height, grade, completed,
        notes, started_at, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name ?? null,
      gymId,
      input.photoUri ?? null,
      input.photoWidth ?? null,
      input.photoHeight ?? null,
      input.grade ?? null,
      input.completed ? 1 : 0,
      input.notes ?? null,
      input.startedAt ?? null,
      input.completedAt ?? null,
      now,
      now,
    ],
  );
  return getRouteByIdOrThrow(result.lastInsertRowId);
}

export async function updateRoute(id: number, input: RouteInput): Promise<RouteWithGym> {
  const db = getDatabase();
  const now = Date.now();
  const gymId = await upsertGym(input.gymName, now);
  await db.runAsync(
    `UPDATE routes SET
       name = ?, gym_id = ?, photo_uri = ?, photo_width = ?, photo_height = ?,
       grade = ?, completed = ?, notes = ?, started_at = ?, completed_at = ?,
       updated_at = ?
     WHERE id = ?`,
    [
      input.name ?? null,
      gymId,
      input.photoUri ?? null,
      input.photoWidth ?? null,
      input.photoHeight ?? null,
      input.grade ?? null,
      input.completed ? 1 : 0,
      input.notes ?? null,
      input.startedAt ?? null,
      input.completedAt ?? null,
      now,
      id,
    ],
  );
  return getRouteByIdOrThrow(id);
}

export async function deleteRoute(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM routes WHERE id = ?', [id]);
}

export async function getRouteById(id: number): Promise<RouteWithGym | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RouteJoinRow>(`${ROUTE_SELECT} WHERE r.id = ?`, [id]);
  return row === null ? null : mapRoute(row);
}

export async function getRoutes(filters: RouteFilters = {}): Promise<RouteWithGym[]> {
  const db = getDatabase();
  const clauses: string[] = [];
  const params: (number | string)[] = [];
  if (filters.completed !== undefined) {
    clauses.push('r.completed = ?');
    params.push(filters.completed ? 1 : 0);
  }
  if (filters.gymId !== undefined) {
    clauses.push('r.gym_id = ?');
    params.push(filters.gymId);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync<RouteJoinRow>(
    `${ROUTE_SELECT} ${where} ORDER BY r.created_at DESC`,
    params,
  );
  return rows.map(mapRoute);
}

export async function getProjects(): Promise<RouteWithGym[]> {
  return getRoutes({ completed: false });
}

export async function getGyms(): Promise<Gym[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<GymRow>('SELECT * FROM gyms ORDER BY name COLLATE NOCASE ASC');
  return rows.map(mapGym);
}

export async function getRoutesInRange(startMs: number, endMs: number): Promise<RouteWithGym[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<RouteJoinRow>(
    `${ROUTE_SELECT} WHERE r.created_at >= ? AND r.created_at <= ? ORDER BY r.created_at DESC`,
    [startMs, endMs],
  );
  return rows.map(mapRoute);
}

export async function resetAllData(): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM routes', []);
    await db.runAsync('DELETE FROM gyms', []);
  });
}
