// Domain types for It's A Rock. See docs/BLUEPRINT.md §4.2.

export type GradeBase =
  | 'VB'
  | 'V0'
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'V5'
  | 'V6'
  | 'V7'
  | 'V8'
  | 'V9'
  | 'V10'
  | 'V11'
  | 'V12';

export type GradeModifier = '' | '+' | '-';

export interface Gym {
  readonly id: number;
  name: string;
  normalizedName: string;
  createdAt: number;
  updatedAt: number;
}

export type MediaType = 'photo' | 'video';

/** A persisted photo/video attached to a route. */
export interface RouteMedia {
  readonly id: number;
  routeId: number;
  uri: string;
  type: MediaType;
  width: number | null;
  height: number | null;
  /** Order within the route's gallery; lower comes first. */
  position: number;
  createdAt: number;
}

/** A media item in the form, before it has been persisted. */
export interface MediaItem {
  uri: string;
  type: MediaType;
  width: number | null;
  height: number | null;
}

export interface BoulderRoute {
  readonly id: number;
  name: string | null;
  gymId: number;
  /** Cached cover image (first photo in the gallery), used by tiles/cards. */
  photoUri: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  /** Serialized base+modifier, e.g. "V4+". */
  grade: string | null;
  completed: boolean;
  notes: string | null;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface RouteWithGym extends BoulderRoute {
  gym: Gym;
  /** Full gallery, populated on detail loads; empty in list queries. */
  media: RouteMedia[];
}

export interface RouteInput {
  name?: string | null;
  /** Resolved/created into a gym row by normalized name. */
  gymName: string;
  /** Full gallery to persist. Omit (undefined) to leave existing media untouched. */
  media?: MediaItem[];
  /** Legacy single-photo seed; used only when `media` is omitted. */
  photoUri?: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  grade?: string | null;
  completed: boolean;
  notes?: string | null;
  startedAt?: number | null;
  completedAt?: number | null;
}

export interface RouteFilters {
  /** Filter by completion status; omit for all routes. */
  completed?: boolean;
  /** Restrict to a single gym. */
  gymId?: number;
}

// ---- History tab filtering & sorting ----

export type HistoryCompletion = 'all' | 'completed' | 'projects';

export type HistorySort =
  | 'date-desc'
  | 'date-asc'
  | 'grade-desc'
  | 'grade-asc'
  | 'gym-asc';

export interface HistoryFilters {
  completion: HistoryCompletion;
  /** Restrict to one gym, or null for all. */
  gymId: number | null;
  /** Lowest V-scale base to include (serialized grade), or null for no floor. */
  gradeMin: string | null;
  /** Highest V-scale base to include (serialized grade), or null for no ceiling. */
  gradeMax: string | null;
  sort: HistorySort;
}

export interface WeeklyStats {
  /** Local midnight of the week's Monday. */
  weekStart: number;
  /** Distinct days with >=1 route logged this week. */
  visits: number;
  /** Routes sent this week. */
  completedThisWeek: number;
  /** Routes created this week. */
  addedThisWeek: number;
  /** Current count of completed = false. */
  activeProjects: number;
}

// ---- Settings / theme ----

export type ThemeMode = 'light' | 'dark' | 'system';

/** Tiles per row in the route grid. */
export type ColumnDensity = 2 | 3 | 4;
