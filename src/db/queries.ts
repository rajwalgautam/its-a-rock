import { type SQLiteBindValue } from 'expo-sqlite';
import { getDatabase } from './database';
import { Gym, RouteFilters, RouteGrade, RouteInput, RouteTagId, RouteWithRelations } from '@/types';
import { getMonthRange } from '@/utils/dateUtils';
import { formatGymName, normalizeGymName } from '@/utils/gymUtils';
import { validateRouteInput } from '@/utils/validators';

interface GymRow {
  id: number;
  name: string;
  normalized_name: string;
  created_at: number;
  updated_at: number;
}

interface RouteJoinRow {
  id: number;
  name: string;
  gym_id: number;
  photo_asset_id: string | null;
  photo_uri: string | null;
  photo_width: number | null;
  photo_height: number | null;
  grade: string;
  attempts: number;
  completed: number;
  notes: string | null;
  climbed_at: number;
  created_at: number;
  updated_at: number;
  gym_name: string;
  gym_normalized_name: string;
  gym_created_at: number;
  gym_updated_at: number;
  tag_id: string | null;
}

function mapGym(row: GymRow): Gym {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoutes(rows: RouteJoinRow[]): RouteWithRelations[] {
  const byId = new Map<number, RouteWithRelations>();

  for (const row of rows) {
    const existing = byId.get(row.id);
    if (existing) {
      if (row.tag_id !== null && !existing.tags.includes(row.tag_id as RouteTagId)) {
        existing.tags.push(row.tag_id as RouteTagId);
      }
      continue;
    }

    byId.set(row.id, {
      id: row.id,
      name: row.name,
      gymId: row.gym_id,
      photoAssetId: row.photo_asset_id,
      photoUri: row.photo_uri,
      photoWidth: row.photo_width,
      photoHeight: row.photo_height,
      grade: row.grade as RouteGrade,
      attempts: row.attempts,
      completed: row.completed === 1,
      notes: row.notes,
      climbedAt: row.climbed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      gym: {
        id: row.gym_id,
        name: row.gym_name,
        normalizedName: row.gym_normalized_name,
        createdAt: row.gym_created_at,
        updatedAt: row.gym_updated_at,
      },
      tags: row.tag_id === null ? [] : [row.tag_id as RouteTagId],
    });
  }

  return Array.from(byId.values());
}

async function getRouteRows(where = '', params: SQLiteBindValue[] = []): Promise<RouteWithRelations[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<RouteJoinRow>(
    `
      SELECT
        r.id,
        r.name,
        r.gym_id,
        r.photo_asset_id,
        r.photo_uri,
        r.photo_width,
        r.photo_height,
        r.grade,
        r.attempts,
        r.completed,
        r.notes,
        r.climbed_at,
        r.created_at,
        r.updated_at,
        g.name AS gym_name,
        g.normalized_name AS gym_normalized_name,
        g.created_at AS gym_created_at,
        g.updated_at AS gym_updated_at,
        rt.tag_id
      FROM boulder_routes r
      JOIN gyms g ON g.id = r.gym_id
      LEFT JOIN route_tags rt ON rt.route_id = r.id
      ${where}
      ORDER BY r.climbed_at DESC, r.created_at DESC, r.id DESC
    `,
    params,
  );
  return mapRoutes(rows);
}

export async function getGyms(): Promise<Gym[]> {
  const rows = await getDatabase().getAllAsync<GymRow>('SELECT * FROM gyms ORDER BY name COLLATE NOCASE ASC');
  return rows.map(mapGym);
}

export async function findOrCreateGym(name: string): Promise<Gym> {
  const database = getDatabase();
  const displayName = formatGymName(name);
  const normalizedName = normalizeGymName(name);
  const existing = await database.getFirstAsync<GymRow>('SELECT * FROM gyms WHERE normalized_name = ?', [normalizedName]);
  if (existing) return mapGym(existing);

  const now = Date.now();
  const result = await database.runAsync(
    'INSERT INTO gyms (name, normalized_name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [displayName, normalizedName, now, now],
  );
  return {
    id: result.lastInsertRowId,
    name: displayName,
    normalizedName,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createRoute(input: RouteInput): Promise<RouteWithRelations> {
  const validation = validateRouteInput(input);
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0] ?? 'Route is invalid.');
  }

  const database = getDatabase();
  const gym = await findOrCreateGym(input.gymName);
  const now = Date.now();
  await database.execAsync('BEGIN TRANSACTION');
  try {
    const result = await database.runAsync(
      `
        INSERT INTO boulder_routes (
          name, gym_id, photo_asset_id, photo_uri, photo_width, photo_height, grade,
          attempts, completed, notes, climbed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        input.name.trim(),
        gym.id,
        input.photo?.assetId ?? null,
        input.photo?.uri ?? null,
        input.photo?.width ?? null,
        input.photo?.height ?? null,
        input.grade,
        input.attempts,
        input.completed ? 1 : 0,
        input.notes?.trim() === '' ? null : input.notes ?? null,
        input.climbedAt,
        now,
        now,
      ],
    );
    for (const tagId of input.tagIds) {
      await database.runAsync('INSERT INTO route_tags (route_id, tag_id) VALUES (?, ?)', [result.lastInsertRowId, tagId]);
    }
    await database.execAsync('COMMIT');
    const route = await getRouteById(result.lastInsertRowId);
    if (route === null) throw new Error('Created route could not be loaded.');
    return route;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}

export async function updateRoute(id: number, input: RouteInput): Promise<RouteWithRelations> {
  const validation = validateRouteInput(input);
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0] ?? 'Route is invalid.');
  }

  const database = getDatabase();
  const gym = await findOrCreateGym(input.gymName);
  const now = Date.now();
  await database.execAsync('BEGIN TRANSACTION');
  try {
    await database.runAsync(
      `
        UPDATE boulder_routes
        SET name = ?,
            gym_id = ?,
            photo_asset_id = ?,
            photo_uri = ?,
            photo_width = ?,
            photo_height = ?,
            grade = ?,
            attempts = ?,
            completed = ?,
            notes = ?,
            climbed_at = ?,
            updated_at = ?
        WHERE id = ?
      `,
      [
        input.name.trim(),
        gym.id,
        input.photo?.assetId ?? null,
        input.photo?.uri ?? null,
        input.photo?.width ?? null,
        input.photo?.height ?? null,
        input.grade,
        input.attempts,
        input.completed ? 1 : 0,
        input.notes?.trim() === '' ? null : input.notes ?? null,
        input.climbedAt,
        now,
        id,
      ],
    );
    await database.runAsync('DELETE FROM route_tags WHERE route_id = ?', [id]);
    for (const tagId of input.tagIds) {
      await database.runAsync('INSERT INTO route_tags (route_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }
    await database.execAsync('COMMIT');
    const route = await getRouteById(id);
    if (route === null) throw new Error('Updated route could not be loaded.');
    return route;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}

export async function deleteRoute(id: number): Promise<void> {
  await getDatabase().runAsync('DELETE FROM boulder_routes WHERE id = ?', [id]);
}

export async function getRouteById(id: number): Promise<RouteWithRelations | null> {
  const routes = await getRouteRows('WHERE r.id = ?', [id]);
  return routes[0] ?? null;
}

export async function getRoutes(filters: RouteFilters = {}): Promise<RouteWithRelations[]> {
  const clauses: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (filters.searchQuery?.trim()) {
    clauses.push('r.name LIKE ?');
    params.push(`%${filters.searchQuery.trim()}%`);
  }
  if (filters.gymId !== undefined && filters.gymId !== null) {
    clauses.push('r.gym_id = ?');
    params.push(filters.gymId);
  }
  if (filters.completedFilter === 'completed') {
    clauses.push('r.completed = 1');
  } else if (filters.completedFilter === 'not_completed') {
    clauses.push('r.completed = 0');
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  let routes = await getRouteRows(where, params);
  if (filters.tagIds && filters.tagIds.length > 0) {
    routes = routes.filter((route) => filters.tagIds?.every((tagId) => route.tags.includes(tagId)));
  }
  return routes;
}

export async function getRoutesForMonth(year: number, month: number): Promise<RouteWithRelations[]> {
  const { start, end } = getMonthRange(year, month);
  return getRouteRows('WHERE r.climbed_at BETWEEN ? AND ?', [start, end]);
}

export async function resetAllData(): Promise<void> {
  const database = getDatabase();
  await database.execAsync('BEGIN TRANSACTION');
  try {
    await database.runAsync('DELETE FROM route_tags');
    await database.runAsync('DELETE FROM boulder_routes');
    await database.runAsync('DELETE FROM gyms');
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}
