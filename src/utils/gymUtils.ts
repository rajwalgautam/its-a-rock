// Gym name handling. Routes reference gyms; gyms are deduped by their
// normalized name, so two routes typed as "Movement Englewood" and
// "  movement   englewood " resolve to the same gym row.

/**
 * Collapse a gym/location name to a canonical key for dedupe: trimmed,
 * lowercased, internal whitespace collapsed to single spaces.
 */
export function normalizeGymName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Tidy a user-entered display name without changing its casing intent:
 * trim and collapse internal whitespace.
 */
export function formatGymName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
