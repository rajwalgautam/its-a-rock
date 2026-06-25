import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { getDatabase } from './database';
import { formatGymName, normalizeGymName } from '@/utils/gymUtils';
import type {
  Gym,
  Limb,
  MediaItem,
  PlanMove,
  PlanMoveInput,
  RouteFilters,
  RouteInput,
  RouteMedia,
  RoutePlan,
  RouteWithGym,
} from '@/types';

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

interface RouteMediaRow {
  id: number;
  route_id: number;
  uri: string;
  type: string;
  width: number | null;
  height: number | null;
  position: number;
  created_at: number;
}

function mapMedia(row: RouteMediaRow): RouteMedia {
  return {
    id: row.id,
    routeId: row.route_id,
    uri: row.uri,
    type: row.type === 'video' ? 'video' : 'photo',
    width: row.width,
    height: row.height,
    position: row.position,
    createdAt: row.created_at,
  };
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
    // Populated by getRouteById; list queries leave the gallery empty and rely
    // on the cached cover (photoUri) for tiles.
    media: [],
    gym: {
      id: row.gym_id,
      name: row.gym_name,
      normalizedName: row.gym_normalized_name,
      createdAt: row.gym_created_at,
      updatedAt: row.gym_updated_at,
    },
  };
}

/** First photo in gallery order, used as the cached tile cover. */
function coverPhoto(media: MediaItem[]): MediaItem | null {
  return media.find((m) => m.type === 'photo') ?? null;
}

async function replaceRouteMedia(
  db: ReturnType<typeof getDatabase>,
  routeId: number,
  media: MediaItem[],
  now: number,
): Promise<void> {
  await db.runAsync('DELETE FROM route_media WHERE route_id = ?', [routeId]);
  for (let i = 0; i < media.length; i++) {
    const m = media[i]!;
    await db.runAsync(
      `INSERT INTO route_media (route_id, uri, type, width, height, position, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [routeId, m.uri, m.type, m.width ?? null, m.height ?? null, i, now],
    );
  }
}

export async function getRouteMedia(routeId: number): Promise<RouteMedia[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<RouteMediaRow>(
    'SELECT * FROM route_media WHERE route_id = ? ORDER BY position ASC, id ASC',
    [routeId],
  );
  return rows.map(mapMedia);
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

/**
 * Resolve the gallery to persist for an input. `media` is authoritative when
 * provided; otherwise a legacy single `photoUri` seeds a one-item gallery.
 */
function resolveMedia(input: RouteInput): MediaItem[] {
  if (input.media !== undefined) return input.media;
  if (input.photoUri != null && input.photoUri.length > 0) {
    return [
      {
        uri: input.photoUri,
        type: 'photo',
        width: input.photoWidth ?? null,
        height: input.photoHeight ?? null,
      },
    ];
  }
  return [];
}

export async function createRoute(input: RouteInput): Promise<RouteWithGym> {
  const db = getDatabase();
  const now = Date.now();
  const gymId = await upsertGym(input.gymName, now);
  const media = resolveMedia(input);
  const cover = coverPhoto(media);
  let newId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO routes
         (name, gym_id, photo_uri, photo_width, photo_height, grade, completed,
          notes, started_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name ?? null,
        gymId,
        cover?.uri ?? null,
        cover?.width ?? null,
        cover?.height ?? null,
        input.grade ?? null,
        input.completed ? 1 : 0,
        input.notes ?? null,
        input.startedAt ?? null,
        input.completedAt ?? null,
        now,
        now,
      ],
    );
    newId = result.lastInsertRowId;
    await replaceRouteMedia(db, newId, media, now);
  });
  return getRouteByIdOrThrow(newId);
}

export async function updateRoute(id: number, input: RouteInput): Promise<RouteWithGym> {
  const db = getDatabase();
  const now = Date.now();
  const gymId = await upsertGym(input.gymName, now);
  // When `media` is provided it's authoritative; the cover is its first photo.
  // When omitted (e.g. a quick completion toggle), the gallery is left intact
  // and the existing cached cover (input.photoUri) is preserved.
  const cover =
    input.media !== undefined
      ? coverPhoto(input.media)
      : input.photoUri != null && input.photoUri.length > 0
        ? {
            uri: input.photoUri,
            type: 'photo' as const,
            width: input.photoWidth ?? null,
            height: input.photoHeight ?? null,
          }
        : null;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE routes SET
         name = ?, gym_id = ?, photo_uri = ?, photo_width = ?, photo_height = ?,
         grade = ?, completed = ?, notes = ?, started_at = ?, completed_at = ?,
         updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? null,
        gymId,
        cover?.uri ?? null,
        cover?.width ?? null,
        cover?.height ?? null,
        input.grade ?? null,
        input.completed ? 1 : 0,
        input.notes ?? null,
        input.startedAt ?? null,
        input.completedAt ?? null,
        now,
        id,
      ],
    );
    if (input.media !== undefined) {
      await replaceRouteMedia(db, id, input.media, now);
    }
  });
  return getRouteByIdOrThrow(id);
}

export async function deleteRoute(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM routes WHERE id = ?', [id]);
}

export async function getRouteById(id: number): Promise<RouteWithGym | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RouteJoinRow>(`${ROUTE_SELECT} WHERE r.id = ?`, [id]);
  if (row === null) return null;
  const route = mapRoute(row);
  route.media = await getRouteMedia(id);
  return route;
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

async function getGymByIdOrThrow(id: number): Promise<Gym> {
  const db = getDatabase();
  const row = await db.getFirstAsync<GymRow>('SELECT * FROM gyms WHERE id = ?', [id]);
  if (row === null) throw new Error(`Gym ${id} not found after write`);
  return mapGym(row);
}

/** Create a new gym, rejecting a name that resolves to an existing one. */
export async function createGym(name: string): Promise<Gym> {
  const db = getDatabase();
  const now = Date.now();
  const display = formatGymName(name);
  const normalized = normalizeGymName(name);
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM gyms WHERE normalized_name = ?',
    [normalized],
  );
  if (existing !== null) throw new Error('A location with that name already exists.');
  const result = await db.runAsync(
    'INSERT INTO gyms (name, normalized_name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [display, normalized, now, now],
  );
  return getGymByIdOrThrow(result.lastInsertRowId);
}

/** Rename a gym, rejecting a name that collides with a different gym. */
export async function updateGym(id: number, name: string): Promise<Gym> {
  const db = getDatabase();
  const now = Date.now();
  const display = formatGymName(name);
  const normalized = normalizeGymName(name);
  const dupe = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM gyms WHERE normalized_name = ? AND id != ?',
    [normalized, id],
  );
  if (dupe !== null) throw new Error('A location with that name already exists.');
  await db.runAsync('UPDATE gyms SET name = ?, normalized_name = ?, updated_at = ? WHERE id = ?', [
    display,
    normalized,
    now,
    id,
  ]);
  return getGymByIdOrThrow(id);
}

/** Number of routes logged at a gym — used to warn before deletion. */
export async function countRoutesForGym(gymId: number): Promise<number> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM routes WHERE gym_id = ?',
    [gymId],
  );
  return row?.n ?? 0;
}

/** Delete a gym and any routes logged at it (cascade), in one transaction. */
export async function deleteGym(id: number): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM routes WHERE gym_id = ?', [id]);
    await db.runAsync('DELETE FROM gyms WHERE id = ?', [id]);
  });
}

export async function getRoutesInRange(startMs: number, endMs: number): Promise<RouteWithGym[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<RouteJoinRow>(
    `${ROUTE_SELECT} WHERE r.created_at >= ? AND r.created_at <= ? ORDER BY r.created_at DESC`,
    [startMs, endMs],
  );
  return rows.map(mapRoute);
}

// ---- Route planner (v1.2.0) ----

interface RoutePlanRow {
  id: number;
  route_id: number;
  media_id: number | null;
  name: string | null;
  created_at: number;
  updated_at: number;
}

interface PlanMoveRow {
  id: number;
  plan_id: number;
  limb: string;
  hold_id: number | null;
  x: number;
  y: number;
  sequence: number;
  created_at: number;
}

const LIMBS: readonly Limb[] = ['LH', 'RH', 'LF', 'RF'];

function mapLimb(raw: string): Limb {
  return (LIMBS as readonly string[]).includes(raw) ? (raw as Limb) : 'LH';
}

function mapPlanMove(row: PlanMoveRow): PlanMove {
  return {
    id: row.id,
    planId: row.plan_id,
    limb: mapLimb(row.limb),
    holdId: row.hold_id,
    x: row.x,
    y: row.y,
    sequence: row.sequence,
    createdAt: row.created_at,
  };
}

function mapPlan(row: RoutePlanRow, moves: PlanMove[]): RoutePlan {
  return {
    id: row.id,
    routeId: row.route_id,
    mediaId: row.media_id,
    name: row.name,
    moves,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPlanMoves(planId: number): Promise<PlanMove[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<PlanMoveRow>(
    'SELECT * FROM plan_moves WHERE plan_id = ? ORDER BY sequence ASC, id ASC',
    [planId],
  );
  return rows.map(mapPlanMove);
}

export async function getPlanById(id: number): Promise<RoutePlan | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RoutePlanRow>('SELECT * FROM route_plans WHERE id = ?', [id]);
  if (row === null) return null;
  return mapPlan(row, await getPlanMoves(id));
}

/** The route's plan (one per route for now), or null if none exists yet. */
export async function getPlanForRoute(routeId: number): Promise<RoutePlan | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RoutePlanRow>(
    'SELECT * FROM route_plans WHERE route_id = ? ORDER BY id ASC LIMIT 1',
    [routeId],
  );
  if (row === null) return null;
  return mapPlan(row, await getPlanMoves(row.id));
}

export async function createPlan(
  routeId: number,
  mediaId: number | null,
  name: string | null = null,
): Promise<RoutePlan> {
  const db = getDatabase();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO route_plans (route_id, media_id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [routeId, mediaId, name, now, now],
  );
  const plan = await getPlanById(result.lastInsertRowId);
  if (plan === null) throw new Error('Plan not found after create');
  return plan;
}

/** Get the route's plan, creating an empty one on the given photo if absent. */
export async function getOrCreatePlanForRoute(
  routeId: number,
  mediaId: number | null,
): Promise<RoutePlan> {
  const existing = await getPlanForRoute(routeId);
  if (existing !== null) return existing;
  return createPlan(routeId, mediaId);
}

/**
 * Replace a plan's moves with `moves`, renumbering `sequence` 0..n in array
 * order, and bump the plan's `updated_at`. Returns the reloaded plan.
 */
export async function savePlanMoves(planId: number, moves: PlanMoveInput[]): Promise<RoutePlan> {
  const db = getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM plan_moves WHERE plan_id = ?', [planId]);
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i]!;
      await db.runAsync(
        `INSERT INTO plan_moves (plan_id, limb, hold_id, x, y, sequence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [planId, m.limb, m.holdId ?? null, m.x, m.y, i, now],
      );
    }
    await db.runAsync('UPDATE route_plans SET updated_at = ? WHERE id = ?', [now, planId]);
  });
  const plan = await getPlanById(planId);
  if (plan === null) throw new Error('Plan not found after saving moves');
  return plan;
}

export async function deletePlan(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM route_plans WHERE id = ?', [id]);
}

/** Best-effort lowercase file extension from a URI, defaulting to `jpg`. */
function fileExtension(uri: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(withoutQuery);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

/**
 * Copy a media item's file into app storage (`documentDirectory/plans`) so a
 * plan anchored to it can't be orphaned by OS cache eviction, repointing the
 * `route_media.uri` (and the cached cover on `routes`) to the durable copy.
 * Idempotent: a file already under documentDirectory is left untouched. Returns
 * the durable URI, or null when the media row is missing or has no usable file.
 */
export async function persistPlanPhoto(mediaId: number): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ uri: string }>('SELECT uri FROM route_media WHERE id = ?', [
    mediaId,
  ]);
  const oldUri = row?.uri;
  if (oldUri === undefined || oldUri.length === 0) return null;
  if (documentDirectory === null) return oldUri;
  if (oldUri.startsWith(documentDirectory)) return oldUri;

  const dir = `${documentDirectory}plans/`;
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  const dest = `${dir}media-${mediaId}.${fileExtension(oldUri)}`;
  await copyAsync({ from: oldUri, to: dest });

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE route_media SET uri = ? WHERE id = ?', [dest, mediaId]);
    await db.runAsync('UPDATE routes SET photo_uri = ? WHERE photo_uri = ?', [dest, oldUri]);
  });
  return dest;
}

export async function resetAllData(): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM routes', []);
    await db.runAsync('DELETE FROM gyms', []);
  });
}
