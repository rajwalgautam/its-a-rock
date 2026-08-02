// Route-planner tuning that's shared between the screen, the canvas markers,
// and the persisted bubble-size preference.

import { LIMB_ORDER } from '@/constants/limbs';
import type { Limb } from '@/types';

/**
 * How much of the body a plan covers. `full` places all four limbs; `hands`
 * restricts the planner to the two hands (for beta that only tracks handholds).
 */
export type PlanMode = 'hands' | 'full';

/** The two hands, in canonical order — the limbs a hands-only plan can place. */
export const HANDS_ONLY_LIMBS: readonly Limb[] = ['LH', 'RH'];

/** The limbs a given plan mode lets you place. */
export function limbsForMode(mode: PlanMode): readonly Limb[] {
  return mode === 'hands' ? HANDS_ONLY_LIMBS : LIMB_ORDER;
}

/** Coerce an untrusted nav param into a valid plan mode (defaults to `full`). */
export function parsePlanMode(value: string | undefined): PlanMode {
  return value === 'hands' ? 'hands' : 'full';
}

/**
 * Discrete bubble (limb marker) sizes the user can step through on the plan
 * screen, as multipliers of the base dot size. `1` is the historical size.
 */
export const BUBBLE_SCALES = [0.7, 0.85, 1, 1.2, 1.4, 1.6] as const;

export const DEFAULT_BUBBLE_SCALE = 1;
export const MIN_BUBBLE_SCALE = BUBBLE_SCALES[0];
export const MAX_BUBBLE_SCALE = BUBBLE_SCALES[BUBBLE_SCALES.length - 1];

/** Snap an arbitrary scale to the nearest allowed bubble size. */
export function nearestBubbleScale(value: number): number {
  return BUBBLE_SCALES.reduce((best, s) =>
    Math.abs(s - value) < Math.abs(best - value) ? s : best,
  );
}

/** Step to the adjacent bubble size; `dir` is -1 (smaller) or +1 (larger). */
export function stepBubbleScale(value: number, dir: -1 | 1): number {
  const i = BUBBLE_SCALES.indexOf(nearestBubbleScale(value) as (typeof BUBBLE_SCALES)[number]);
  const next = Math.max(0, Math.min(BUBBLE_SCALES.length - 1, i + dir));
  return BUBBLE_SCALES[next]!;
}

/**
 * Discrete opacities the user can step through for the limb bubbles/badges, as
 * a fraction (1 = fully opaque). Lower values make the markers more transparent
 * so the holds underneath show through.
 */
export const BUBBLE_OPACITIES = [0.35, 0.5, 0.65, 0.8, 1] as const;

export const DEFAULT_BUBBLE_OPACITY = 1;
export const MIN_BUBBLE_OPACITY = BUBBLE_OPACITIES[0];
export const MAX_BUBBLE_OPACITY = BUBBLE_OPACITIES[BUBBLE_OPACITIES.length - 1];

/** Snap an arbitrary opacity to the nearest allowed value. */
export function nearestBubbleOpacity(value: number): number {
  return BUBBLE_OPACITIES.reduce((best, o) =>
    Math.abs(o - value) < Math.abs(best - value) ? o : best,
  );
}

/** Step to the adjacent opacity; `dir` is -1 (more transparent) or +1 (more opaque). */
export function stepBubbleOpacity(value: number, dir: -1 | 1): number {
  const i = BUBBLE_OPACITIES.indexOf(
    nearestBubbleOpacity(value) as (typeof BUBBLE_OPACITIES)[number],
  );
  const next = Math.max(0, Math.min(BUBBLE_OPACITIES.length - 1, i + dir));
  return BUBBLE_OPACITIES[next]!;
}

/**
 * Autoplay speeds for the playback slideshow: how long each frame is held before
 * advancing. Comfortably longer than the 280ms marker glide so a move finishes
 * settling before the next begins. `Normal` is the default.
 */
export interface PlaybackSpeed {
  label: string;
  intervalMs: number;
}

export const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [
  { label: 'Slow', intervalMs: 2200 },
  { label: 'Normal', intervalMs: 1300 },
  { label: 'Fast', intervalMs: 700 },
  { label: 'Turbo', intervalMs: 400 },
];

export const DEFAULT_PLAYBACK_SPEED_INDEX = 1;

/**
 * The swatches offered when choosing the left/right limb marker colors. The
 * hand/foot glyph is drawn in black or white per swatch (whichever contrasts),
 * so both the near-black and near-white ends stay legible.
 */
export const LIMB_COLOR_CHOICES = [
  '#111111',
  '#FFFFFF',
  '#16A34A',
  '#2563EB',
  '#D97706',
  '#9333EA',
  '#DC2626',
  '#0EA5E9',
] as const;

/**
 * Default limb marker colors: left is a black bubble with a white glyph, right a
 * white bubble with a black glyph — a high-contrast pair that reads at a glance.
 */
export const DEFAULT_LIMB_COLOR_LEFT = '#111111';
export const DEFAULT_LIMB_COLOR_RIGHT = '#FFFFFF';

/** Coerce an untrusted stored value to a usable hex color, else the fallback. */
export function validLimbColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
