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
    // YDS and French grades are valid too, in their systems.
    expect(validateRouteInput(input({ grade: '5.11a' })).valid).toBe(true);
    expect(validateRouteInput(input({ grade: '6b+' })).valid).toBe(true);
    expect(validateRouteInput(input({ grade: 'banana' })).valid).toBe(false);
  });

  it('accepts a valid grade range and rejects a reversed one', () => {
    expect(validateRouteInput(input({ grade: 'V0-V2' })).valid).toBe(true);
    const reversed = validateRouteInput(input({ grade: 'V5-V2' }));
    expect(reversed.valid).toBe(false);
    expect(reversed.errors.grade).toMatch(/start must be at or below/i);
  });

  it('rejects a start day after the send day', () => {
    const started = new Date(2026, 5, 22, 9, 0, 0).getTime();
    const completed = new Date(2026, 5, 21, 9, 0, 0).getTime();
    const result = validateRouteInput(input({ startedAt: started, completedAt: completed }));
    expect(result.valid).toBe(false);
    expect(result.errors.dates).toBeDefined();
  });

  it('accepts start before send', () => {
    const started = new Date(2026, 5, 20, 9, 0, 0).getTime();
    const completed = new Date(2026, 5, 22, 9, 0, 0).getTime();
    expect(validateRouteInput(input({ startedAt: started, completedAt: completed })).valid).toBe(true);
  });

  it('accepts the same calendar day regardless of time of day', () => {
    // Started later in the day than completed, but same day → must be valid.
    const started = new Date(2026, 5, 21, 14, 30, 0).getTime();
    const completed = new Date(2026, 5, 21, 9, 0, 0).getTime();
    const result = validateRouteInput(input({ startedAt: started, completedAt: completed }));
    expect(result.valid).toBe(true);
    expect(result.errors.dates).toBeUndefined();
  });
});
