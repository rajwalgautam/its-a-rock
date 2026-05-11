import { NOTES_MAX_LENGTH, ROUTE_NAME_MAX_LENGTH, TAGS_MAX_SELECTED } from '@/constants/limits';
import { RouteInput } from '@/types';
import { validateRouteInput } from '@/utils/validators';

function makeInput(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    name: 'Blue cave',
    gymName: 'Local Gym',
    grade: 'V3',
    attempts: 2,
    completed: true,
    notes: 'Good heel hook.',
    tagIds: ['technical'],
    climbedAt: Date.now(),
    ...overrides,
  };
}

describe('validateRouteInput', () => {
  it('accepts a valid route', () => {
    expect(validateRouteInput(makeInput()).valid).toBe(true);
  });

  it('requires route name and gym', () => {
    const result = validateRouteInput(makeInput({ name: ' ', gymName: ' ' }));
    expect(result.errors.name).toBeDefined();
    expect(result.errors.gymName).toBeDefined();
  });

  it('enforces character limits', () => {
    const result = validateRouteInput(makeInput({
      name: 'x'.repeat(ROUTE_NAME_MAX_LENGTH + 1),
      notes: 'x'.repeat(NOTES_MAX_LENGTH + 1),
    }));
    expect(result.errors.name).toBeDefined();
    expect(result.errors.notes).toBeDefined();
  });

  it('enforces attempts and tag limits', () => {
    const result = validateRouteInput(makeInput({
      attempts: 1000,
      tagIds: Array.from({ length: TAGS_MAX_SELECTED + 1 }, () => 'technical'),
    }));
    expect(result.errors.attempts).toBeDefined();
    expect(result.errors.tagIds).toBeDefined();
  });

  it('enforces the supported grade range', () => {
    const result = validateRouteInput(makeInput({ grade: 'V10' as RouteInput['grade'] }));
    expect(result.errors.grade).toBeDefined();
  });
});
