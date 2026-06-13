export function isNewerVersion(remote: string, current: string): boolean {
  // Split on both "." and "-" so a build suffix becomes a trailing segment:
  // "0.2.3-1" -> [0, 2, 3, 1], which ranks above "0.2.3" -> [0, 2, 3]. This
  // matches the release workflow's convention that vX.Y.Z-N is a new build
  // *after* vX.Y.Z (intentionally not semver prerelease ordering). Non-numeric
  // suffixes like "-rerelease" parse to 0, so they tie with the base version.
  const parse = (v: string): number[] =>
    v.replace(/^v/, "").split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const r = parse(remote);
  const c = parse(current);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i++) {
    const rv = r[i] ?? 0;
    const cv = c[i] ?? 0;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  return false;
}

export function formatLastChecked(date: Date | null): string {
  if (date === null) return "Never checked";
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Last checked: ${dateStr} at ${timeStr}`;
}
