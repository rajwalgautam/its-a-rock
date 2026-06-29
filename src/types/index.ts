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
  /** Note entries, populated on detail loads; empty in list queries. */
  noteEntries: RouteNote[];
}

/**
 * A note attached to a route: free text plus an optional media item and an
 * optional move plan drawn on that media. A note can be text-only (`mediaId`
 * null), in which case the UI shows a placeholder where a thumbnail would be.
 */
export interface RouteNote {
  readonly id: number;
  routeId: number;
  /** `route_media` row the note is attached to, or null for a text-only note. */
  mediaId: number | null;
  body: string | null;
  /** Order within the route's notes; lower comes first. */
  position: number;
  createdAt: number;
  updatedAt: number;
  /** The attached media item, resolved on detail loads (null when text-only). */
  media: RouteMedia | null;
  /** True when a plan with at least one move exists for this note. */
  hasPlan: boolean;
}

/**
 * A note to persist. The attached media is matched to a gallery row by URI at
 * save time, so the media must also be present in the route's `media` gallery.
 */
export interface RouteNoteInput {
  /** Stable id of an existing note to preserve its plan across a save; omit for new notes. */
  id?: number | null;
  body: string | null;
  /** URI of the attached gallery media item, or null for a text-only note. */
  mediaUri: string | null;
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
  /** Legacy single-string note column; kept for back-compat. */
  notes?: string | null;
  /** Note entries to persist. Omit (undefined) to leave existing notes untouched. */
  noteEntries?: RouteNoteInput[];
  startedAt?: number | null;
  completedAt?: number | null;
}

export interface RouteFilters {
  /** Filter by completion status; omit for all routes. */
  completed?: boolean;
  /** Restrict to a single gym. */
  gymId?: number;
}

// ---- Route planner ----

/** A limb the climber places on the wall. */
export type Limb = 'LH' | 'RH' | 'LF' | 'RF';

/** A single placement in a plan: one limb to one spot, ordered by `sequence`. */
export interface PlanMove {
  readonly id: number;
  planId: number;
  limb: Limb;
  /**
   * Soft reference to a detected hold (`route_holds.id`) when snapped, or null
   * when placed freehand. Stored without a FK so the planner has no dependency
   * on the (later) detection tables.
   */
  holdId: number | null;
  /** Normalized position in [0,1] relative to the photo's intrinsic pixels. */
  x: number;
  y: number;
  /**
   * Frame id: moves sharing the same non-null `groupId` move simultaneously
   * (one frame). Null is a solo move. Ids are only unique within a plan.
   */
  groupId: number | null;
  /** 0-based, contiguous order within the plan. */
  sequence: number;
  createdAt: number;
}

/** A move to persist; id/sequence/createdAt are assigned by the query layer. */
export interface PlanMoveInput {
  limb: Limb;
  holdId?: number | null;
  x: number;
  y: number;
  groupId?: number | null;
}

/** An ordered sequence of moves drawn on one photo of a route. */
export interface RoutePlan {
  readonly id: number;
  routeId: number;
  /** The note this plan belongs to (v1.4.0+), or null for a route-level plan. */
  noteId: number | null;
  /** The media item (photo) the plan is drawn on, or null if it was removed. */
  mediaId: number | null;
  name: string | null;
  /** Moves in `sequence` order. */
  moves: PlanMove[];
  createdAt: number;
  updatedAt: number;
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
export type ColumnDensity = 1 | 2 | 3 | 4;

/** How a route's notes are laid out on the detail card. */
export type NotesLayout = 'rows' | 'grid';
