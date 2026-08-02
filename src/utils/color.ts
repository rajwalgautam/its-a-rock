// Small color helpers for picking legible foreground colors over a chosen
// background (used by the customizable left/right limb marker colors).

/** Parse a 3- or 6-digit hex string to [r, g, b] in 0–255, or null if invalid. */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (m === null) return null;
  let h = m[1]!;
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance (0 = black, 1 = white) via the sRGB WCAG formula. */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (rgb === null) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Black or white — whichever reads better on top of `bg`. Used so a limb
 * marker's hand/foot glyph (and outline) stays legible whatever background
 * color the climber picks, e.g. a white glyph on black, a black glyph on white.
 */
export function contrastColor(bg: string): '#000000' | '#FFFFFF' {
  return luminance(bg) > 0.5 ? '#000000' : '#FFFFFF';
}
