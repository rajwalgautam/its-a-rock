import { validateRouteInput } from '@/utils/validators';
import type { RouteInput } from '@/types';

function input(partial: Partial<RouteInput>): RouteInput {
  return { gymName: 'Movement Englewood', completed: false, ...partial };
}

describe('validateRouteInput', () => {
  it('accepts a minimal input with just a gym', () => {
    expect(validateRouteInput(input({})).valid).toBe(true);
  });

  it('requires a non-empty gym name', () => {
    const result = validateRouteInput(input({ gymName: '   ' }));
    expect(result.valid).toBe(false);
    expect(result.errors.gymName).toBeDefined();
  });

  it('allows omitting all optional fields', () => {
    const result = validateRouteInput(
      input({ name: null, grade: null, notes: null, photoUri: null }),
    );
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid grade but allows a valid or empty one', () => {
    expect(validateRouteInput(input({ grade: 'V4+' })).valid).toBe(true);
    expect(validateRouteInput(input({ grade: '' })).valid).toBe(true);
    expect(validateRouteInput(input({ grade: '5.11a' })).valid).toBe(false);
  });

  it('rejects a start date after the send date', () => {
    const result = validateRouteInput(input({ startedAt: 2000, completedAt: 1000 }));
    expect(result.valid).toBe(false);
    expect(result.errors.dates).toBeDefined();
  });

  it('accepts start before send', () => {
    expect(validateRouteInput(input({ startedAt: 1000, completedAt: 2000 })).valid).toBe(true);
  });
});
