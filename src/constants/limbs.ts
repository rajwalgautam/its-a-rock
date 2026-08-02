import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Limb } from '@/types';

/** Canonical limb order for the selector and any limb iteration. */
export const LIMB_ORDER: readonly Limb[] = ['LH', 'RH', 'LF', 'RF'];

/** Which side of the body a limb belongs to — the granularity of marker color. */
export type LimbSide = 'left' | 'right';

/**
 * A limb's side. Marker color is scoped to the side (not the limb), so the left
 * hand and left foot share one color and the right hand and right foot another.
 */
export const LIMB_SIDE: Record<Limb, LimbSide> = {
  LH: 'left',
  LF: 'left',
  RH: 'right',
  RF: 'right',
};

type MCIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Pictographic icon for each limb (used in the planner's limb selector). */
export const LIMB_ICON: Record<Limb, MCIconName> = {
  LH: 'hand-back-left',
  RH: 'hand-back-right',
  LF: 'shoe-print',
  RF: 'shoe-print',
};

/**
 * Whether the limb icon should be horizontally mirrored. The foot glyph only
 * comes in one orientation, so the left foot is flipped to read as a pair.
 */
export const LIMB_ICON_FLIP: Record<Limb, boolean> = {
  LH: false,
  RH: false,
  LF: true,
  RF: false,
};

/** Short marker/chip label. */
export const LIMB_LABEL: Record<Limb, string> = {
  LH: 'LH',
  RH: 'RH',
  LF: 'LF',
  RF: 'RF',
};

/** Full name for captions and accessibility. */
export const LIMB_NAME: Record<Limb, string> = {
  LH: 'Left hand',
  RH: 'Right hand',
  LF: 'Left foot',
  RF: 'Right foot',
};

/**
 * The user's marker/chip color for a limb, picked by side from the two
 * configurable side colors (see settings). Left hand/foot share `left`, right
 * hand/foot share `right`.
 */
export function limbColor(sides: { left: string; right: string }, limb: Limb): string {
  return LIMB_SIDE[limb] === 'left' ? sides.left : sides.right;
}
