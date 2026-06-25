import type { Palette } from '@/constants/theme';
import type { Limb } from '@/types';

/** Canonical limb order for the selector and any limb iteration. */
export const LIMB_ORDER: readonly Limb[] = ['LH', 'RH', 'LF', 'RF'];

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
