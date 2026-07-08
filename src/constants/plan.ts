// Route-planner tuning that's shared between the screen, the canvas markers,
// and the persisted bubble-size preference.

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
