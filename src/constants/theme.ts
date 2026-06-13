// Two palettes with an identical key set so components never branch on mode —
// they read `useTheme().colors.x`. Shared scales (spacing/radius/font/shadow)
// are mode-independent.

export interface Palette {
  /** App background behind all screens. */
  background: string;
  /** Cards, tiles, sheets sitting on the background. */
  surface: string;
  /** A slightly raised/inset surface (inputs, segmented controls). */
  surfaceAlt: string;
  /** Primary text. */
  textPrimary: string;
  /** Secondary/supporting text. */
  textSecondary: string;
  /** De-emphasized text (placeholders, captions). */
  textMuted: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Brand/accent used for primary actions and the FAB. */
  primary: string;
  /** Foreground drawn on top of `primary`. */
  onPrimary: string;
  /** Muted brand tint for subtle fills. */
  primaryMuted: string;
  /** "Sent" / success state. */
  success: string;
  /** Destructive actions. */
  danger: string;
  /** Warning / projecting accent. */
  warning: string;
  /** Scrim drawn over photos for overlay text legibility. */
  overlay: string;
  /** Text/icons drawn over a photo or scrim. */
  onOverlay: string;
  /** Placeholder fill for tiles without a photo. */
  tilePlaceholder: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const LIGHT: Palette = {
  background: '#F5F5F4',
  surface: '#FFFFFF',
  surfaceAlt: '#ECECEA',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  primary: '#EA580C',
  onPrimary: '#FFFFFF',
  primaryMuted: '#FFEDD5',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  overlay: 'rgba(0, 0, 0, 0.45)',
  onOverlay: '#FFFFFF',
  tilePlaceholder: '#E7E5E4',
  tabBar: '#FFFFFF',
  tabBarActive: '#EA580C',
  tabBarInactive: '#A8A29E',
};

export const DARK: Palette = {
  background: '#0E0E10',
  surface: '#1A1A1D',
  surfaceAlt: '#242427',
  textPrimary: '#FAFAF9',
  textSecondary: '#A8A29E',
  textMuted: '#6B6660',
  border: '#2A2A2E',
  primary: '#F97316',
  onPrimary: '#1C1917',
  primaryMuted: '#3A2415',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.55)',
  onOverlay: '#FAFAF9',
  tilePlaceholder: '#242427',
  tabBar: '#141416',
  tabBarActive: '#F97316',
  tabBarInactive: '#6B6660',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
