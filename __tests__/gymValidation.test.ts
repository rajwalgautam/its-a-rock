import { validateGymName } from '@/utils/gymValidation';
import type { Gym } from '@/types';

function gym(id: number, name: string): Gym {
  return {
    id,
    name,
    normalizedName: name.trim().toLowerCase().replace(/\s+/g, ' '),
    createdAt: 0,
    updatedAt: 0,
  };
}

const EXISTING: Gym[] = [gym(1, 'Movement Englewood'), gym(2, 'The Spot')];

describe('validateGymName', () => {
  it('requires a non-empty name', () => {
    expect(validateGymName('   ', EXISTING)).toMatch(/required/i);
  });

  it('accepts a fresh, unique name', () => {
    expect(validateGymName('Earth Treks', EXISTING)).toBeNull();
  });

  it('rejects a duplicate regardless of casing/whitespace', () => {
    expect(validateGymName('  movement   englewood ', EXISTING)).toMatch(/already exists/i);
  });

  it('allows keeping the same name when editing that gym', () => {
    expect(validateGymName('Movement Englewood', EXISTING, 1)).toBeNull();
  });

  it('still rejects colliding with a different gym while editing', () => {
    expect(validateGymName('The Spot', EXISTING, 1)).toMatch(/already exists/i);
  });
});
