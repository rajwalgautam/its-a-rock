export type RouteTagId =
  | 'slopey'
  | 'crimpy'
  | 'pinchy'
  | 'juggy'
  | 'pocket'
  | 'technical'
  | 'powerful'
  | 'balance'
  | 'dynamic'
  | 'static'
  | 'compression'
  | 'overhang'
  | 'slab'
  | 'vertical'
  | 'long_route'
  | 'short_route'
  | 'reachy'
  | 'coordination'
  | 'footwork'
  | 'project';

export type RouteGrade = 'VB' | 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9';

export interface RouteTag {
  id: RouteTagId;
  label: string;
  category: 'hold' | 'style' | 'movement' | 'angle' | 'endurance' | 'position' | 'technique' | 'status';
  color: string;
}

export interface Gym {
  readonly id: number;
  name: string;
  normalizedName: string;
  createdAt: number;
  updatedAt: number;
}

export interface PhotoRef {
  assetId?: string | null;
  uri?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface BoulderRoute {
  readonly id: number;
  name: string;
  gymId: number;
  photoAssetId?: string | null;
  photoUri?: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  grade: RouteGrade;
  attempts: number;
  completed: boolean;
  notes?: string | null;
  climbedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface RouteWithRelations extends BoulderRoute {
  gym: Gym;
  tags: RouteTagId[];
}

export interface RouteInput {
  name: string;
  gymName: string;
  photo?: PhotoRef | null;
  grade: RouteGrade;
  attempts: number;
  completed: boolean;
  notes?: string | null;
  tagIds: RouteTagId[];
  climbedAt: number;
}

export interface DailyRouteStats {
  date: string;
  totalRoutes: number;
  completedRoutes: number;
  totalAttempts: number;
  gymIds: number[];
  tagCounts: Partial<Record<RouteTagId, number>>;
}

export interface SummaryStats {
  totalRoutes: number;
  completedRoutes: number;
  completionRate: number;
  totalAttempts: number;
  avgAttemptsPerCompleted: number;
  daysClimbed: number;
  activeGyms: number;
  mostClimbedGymName: string | null;
  mostCommonTags: Array<{ tagId: RouteTagId; count: number }>;
}

export type CompletedFilter = 'all' | 'completed' | 'not_completed';

export interface RouteFilters {
  searchQuery?: string;
  gymId?: number | null;
  completedFilter?: CompletedFilter;
  tagIds?: RouteTagId[];
}
