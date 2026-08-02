import {
  clearCurrentCom,
  comOverrideAt,
  computeCenterOfMass,
  frameStanceAt,
  limbStanceAt,
  movingLimbAt,
  movingLimbsAt,
  setCurrentCom,
  type DraftMove,
  type LimbStance,
} from '@/utils/planSequence';
import type { Limb } from '@/types';

function move(limb: Limb, x: number, y: number, groupId: number | null = null): DraftMove {
  return { key: `${limb}-${x}-${y}`, limb, x, y, holdId: null, groupId, floating: false, comX: null, comY: null };
}

// LH→RH→LF→RF, then LH moves again to a new hold.
const moves: DraftMove[] = [
  move('LH', 0.1, 0.1),
  move('RH', 0.2, 0.2),
  move('LF', 0.3, 0.3),
  move('RF', 0.4, 0.4),
  move('LH', 0.5, 0.5),
];

describe('limbStanceAt', () => {
  it('places nothing at step 0', () => {
    expect(limbStanceAt(moves, 0)).toEqual({ LH: null, RH: null, LF: null, RF: null });
  });

  it('accumulates placements move by move', () => {
    expect(limbStanceAt(moves, 1)).toEqual({
      LH: { x: 0.1, y: 0.1 },
      RH: null,
      LF: null,
      RF: null,
    });
    expect(limbStanceAt(moves, 4)).toEqual({
      LH: { x: 0.1, y: 0.1 },
      RH: { x: 0.2, y: 0.2 },
      LF: { x: 0.3, y: 0.3 },
      RF: { x: 0.4, y: 0.4 },
    });
  });

  it('keeps a limb on its last hold until it moves again', () => {
    // After move 5, LH has advanced to its second hold; the rest are unchanged.
    expect(limbStanceAt(moves, 5)).toEqual({
      LH: { x: 0.5, y: 0.5 },
      RH: { x: 0.2, y: 0.2 },
      LF: { x: 0.3, y: 0.3 },
      RF: { x: 0.4, y: 0.4 },
    });
  });

  it('clamps steps beyond the bounds', () => {
    expect(limbStanceAt(moves, 99)).toEqual(limbStanceAt(moves, moves.length));
    expect(limbStanceAt(moves, -5)).toEqual(limbStanceAt(moves, 0));
  });
});

describe('movingLimbAt', () => {
  it('returns null at the start', () => {
    expect(movingLimbAt(moves, 0)).toBeNull();
  });

  it('returns the limb that moves to reach each step', () => {
    expect(movingLimbAt(moves, 1)).toBe('LH');
    expect(movingLimbAt(moves, 2)).toBe('RH');
    expect(movingLimbAt(moves, 5)).toBe('LH');
  });

  it('returns null past the end', () => {
    expect(movingLimbAt(moves, 6)).toBeNull();
  });
});

// LH solo, then LF+RF together (one frame), then RH solo: 3 frames.
const framed: DraftMove[] = [
  move('LH', 0.1, 0.1),
  move('LF', 0.3, 0.3, 9),
  move('RF', 0.4, 0.4, 9),
  move('RH', 0.2, 0.2),
];

describe('frameStanceAt', () => {
  it('advances a whole frame per step', () => {
    expect(frameStanceAt(framed, 1)).toEqual({
      LH: { x: 0.1, y: 0.1 },
      RH: null,
      LF: null,
      RF: null,
    });
    // After frame 2 both feet have landed together.
    expect(frameStanceAt(framed, 2)).toEqual({
      LH: { x: 0.1, y: 0.1 },
      RH: null,
      LF: { x: 0.3, y: 0.3 },
      RF: { x: 0.4, y: 0.4 },
    });
  });

  it('clamps beyond the frame count', () => {
    expect(frameStanceAt(framed, 99)).toEqual(frameStanceAt(framed, 3));
  });
});

describe('movingLimbsAt', () => {
  it('returns every limb in the frame', () => {
    expect(movingLimbsAt(framed, 1)).toEqual(['LH']);
    expect(movingLimbsAt(framed, 2)).toEqual(['LF', 'RF']);
    expect(movingLimbsAt(framed, 3)).toEqual(['RH']);
  });

  it('returns [] at the start and past the end', () => {
    expect(movingLimbsAt(framed, 0)).toEqual([]);
    expect(movingLimbsAt(framed, 4)).toEqual([]);
  });
});

describe('computeCenterOfMass', () => {
  const empty: LimbStance = { LH: null, RH: null, LF: null, RF: null };

  it('returns null when no limb is placed', () => {
    expect(computeCenterOfMass(empty)).toBeNull();
  });

  it('returns the point itself for a single placed limb', () => {
    expect(computeCenterOfMass({ ...empty, LH: { x: 0.2, y: 0.8 } })).toEqual({
      x: 0.2,
      y: 0.8,
    });
  });

  it('returns the midpoint of two placed limbs', () => {
    expect(
      computeCenterOfMass({ ...empty, LH: { x: 0, y: 0 }, RH: { x: 0.4, y: 0.6 } }),
    ).toEqual({ x: 0.2, y: 0.3 });
  });

  it('averages all four placed limbs', () => {
    expect(
      computeCenterOfMass({
        LH: { x: 0, y: 0 },
        RH: { x: 0.4, y: 0 },
        LF: { x: 0, y: 0.8 },
        RF: { x: 0.4, y: 0.8 },
      }),
    ).toEqual({ x: 0.2, y: 0.4 });
  });

  it('composes with frameStanceAt to track the centroid per frame', () => {
    // Frame 1: only LH placed → centroid is LH itself.
    expect(computeCenterOfMass(frameStanceAt(framed, 1))).toEqual({ x: 0.1, y: 0.1 });
    // Frame 2: LH + both feet landed → average of the three points.
    expect(computeCenterOfMass(frameStanceAt(framed, 2))).toEqual({
      x: (0.1 + 0.3 + 0.4) / 3,
      y: (0.1 + 0.3 + 0.4) / 3,
    });
  });
});

describe('center-of-mass overrides', () => {
  it('reads no override from a freshly built plan', () => {
    expect(comOverrideAt(framed, 1)).toBeNull();
    expect(comOverrideAt(framed, 2)).toBeNull();
    expect(comOverrideAt(framed, 3)).toBeNull();
  });

  it('setCurrentCom stores the override on the last move (current frame)', () => {
    const next = setCurrentCom(framed, 0.7, 0.2);
    // The last frame is the RH solo move; its override is now readable.
    expect(comOverrideAt(next, 3)).toEqual({ x: 0.7, y: 0.2 });
    // Earlier frames are untouched.
    expect(comOverrideAt(next, 1)).toBeNull();
    expect(comOverrideAt(next, 2)).toBeNull();
    // Original array is not mutated.
    expect(comOverrideAt(framed, 3)).toBeNull();
  });

  it('reads a grouped frame override from the frame-closing move', () => {
    // Move the RF (which closes the LF+RF frame) to the end so it is current,
    // set an override, and confirm it reads back for that frame. Simpler: build
    // a two-move grouped plan and override it.
    const grouped: DraftMove[] = [
      { key: 'lf', limb: 'LF', x: 0.3, y: 0.3, holdId: null, groupId: 1, floating: false, comX: null, comY: null },
      { key: 'rf', limb: 'RF', x: 0.4, y: 0.4, holdId: null, groupId: 1, floating: false, comX: null, comY: null },
    ];
    const next = setCurrentCom(grouped, 0.35, 0.5);
    expect(comOverrideAt(next, 1)).toEqual({ x: 0.35, y: 0.5 });
  });

  it('clearCurrentCom reverts the current frame to auto', () => {
    const set = setCurrentCom(framed, 0.7, 0.2);
    const cleared = clearCurrentCom(set);
    expect(comOverrideAt(cleared, 3)).toBeNull();
  });

  it('both helpers are no-ops on an empty plan', () => {
    expect(setCurrentCom([], 0.5, 0.5)).toEqual([]);
    expect(clearCurrentCom([])).toEqual([]);
  });
});
