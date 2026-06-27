import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Palette } from '@/constants/theme';
import type { Limb } from '@/types';

/** Canonical limb order for the selector and any limb iteration. */
export const LIMB_ORDER: readonly Limb[] = ['LH', 'RH', 'LF', 'RF'];

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

/** The theme color for a limb's marker/chip. */
export function limbColor(colors: Palette, limb: Limb): string {
  switch (limb) {
    case 'LH':
      return colors.limbLH;
    case 'RH':
      return colors.limbRH;
    case 'LF':
      return colors.limbLF;
    case 'RF':
      return colors.limbRF;
  }
}
