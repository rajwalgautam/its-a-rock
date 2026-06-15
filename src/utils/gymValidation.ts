import { normalizeGymName } from '@/utils/gymUtils';
import type { Gym } from '@/types';

/**
 * Validate a gym name for the Settings location manager. Returns an error
 * message, or null when the name is acceptable. A name is rejected when it is
 * empty or, after normalization, collides with another gym (excluding the gym
 * currently being edited via `currentId`).
 */
export function validateGymName(
  name: string,
  existing: Gym[],
  currentId?: number,
): string | null {
  if (name.trim().length === 0) return 'A location name is required.';
  const normalized = normalizeGymName(name);
  const clash = existing.some((g) => g.id !== currentId && g.normalizedName === normalized);
  return clash ? 'A location with that name already exists.' : null;
}
