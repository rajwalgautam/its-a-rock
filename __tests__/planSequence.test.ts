import {
  addToFrame,
  appendMove,
  framesOf,
  groupMoves,
  isSeeding,
  nextGroupId,
  nextSeedLimb,
  placedLimbs,
  removeFromFrame,
  removeMove,
  reorderFrames,
  reorderMoves,
  toInputs,
  updateMovePosition,
  type DraftMove,
} from '@/utils/planSequence';
import type { Limb } from '@/types';

function move(key: string, limb: Limb = 'LH', groupId: number | null = null): DraftMove {
  return { key, limb, x: 0.5, y: 0.5, holdId: null, groupId };
}

const keys = (moves: DraftMove[]): string[] => moves.map((m) => m.key);
const groupIds = (moves: DraftMove[]): (number | null)[] => moves.map((m) => m.groupId);

describe('reorderMoves', () => {
  const base = [move('a'), move('b'), move('c'), move('d')];

  it('moves an item later, shifting the rest', () => {
    expect(keys(reorderMoves(base, 0, 2))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item earlier', () => {
    expect(keys(reorderMoves(base, 3, 1))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('preserves membership (no adds/drops)', () => {
    expect(keys(reorderMoves(base, 1, 3)).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is a no-op for equal or out-of-range indices', () => {
    expect(reorderMoves(base, 1, 1)).toBe(base);
    expect(reorderMoves(base, -1, 2)).toBe(base);
    expect(reorderMoves(base, 0, 9)).toBe(base);
  });
});

describe('removeMove', () => {
  it('removes the move with the given key', () => {
    expect(keys(removeMove([move('a'), move('b'), move('c')], 'b'))).toEqual(['a', 'c']);
  });

  it('returns the list unchanged when the key is absent', () => {
    const list = [move('a'), move('b')];
    expect(keys(removeMove(list, 'z'))).toEqual(['a', 'b']);
  });
});

describe('appendMove', () => {
  it('adds the move to the end', () => {
    expect(keys(appendMove([move('a')], move('b')))).toEqual(['a', 'b']);
  });
});

describe('updateMovePosition', () => {
  it('updates only the matching move', () => {
    const next = updateMovePosition([move('a'), move('b')], 'b', 0.1, 0.2);
    expect(next[0]).toMatchObject({ key: 'a', x: 0.5, y: 0.5 });
    expect(next[1]).toMatchObject({ key: 'b', x: 0.1, y: 0.2 });
  });
});

describe('toInputs', () => {
  it('strips editor keys and preserves order + fields', () => {
    const moves: DraftMove[] = [
      { key: 'a', limb: 'RH', x: 0.2, y: 0.3, holdId: 7, groupId: 1 },
      { key: 'b', limb: 'LF', x: 0.8, y: 0.9, holdId: null, groupId: null },
    ];
    expect(toInputs(moves)).toEqual([
      { limb: 'RH', x: 0.2, y: 0.3, holdId: 7, groupId: 1 },
      { limb: 'LF', x: 0.8, y: 0.9, holdId: null, groupId: null },
    ]);
  });
});

describe('nextGroupId', () => {
  it('starts at 1 with no groups', () => {
    expect(nextGroupId([move('a'), move('b')])).toBe(1);
  });

  it('is one past the largest group id in use', () => {
    expect(nextGroupId([move('a', 'LH', 2), move('b', 'RH', 5), move('c')])).toBe(6);
  });
});

describe('framesOf', () => {
  it('treats solo moves as singleton frames', () => {
    expect(framesOf([move('a'), move('b')]).map(keys)).toEqual([['a'], ['b']]);
  });

  it('groups adjacent moves sharing a non-null group id', () => {
    const moves = [move('a'), move('b', 'LF', 7), move('c', 'RF', 7), move('d')];
    expect(framesOf(moves).map(keys)).toEqual([['a'], ['b', 'c'], ['d']]);
  });
});

describe('reorderFrames', () => {
  // a | (b,c) | d  ->  frames [a] [b,c] [d]
  const base = [move('a'), move('b', 'LF', 7), move('c', 'RF', 7), move('d')];

  it('moves a whole frame, keeping members together', () => {
    expect(keys(reorderFrames(base, 1, 0))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('is a no-op for out-of-range or equal indices', () => {
    expect(reorderFrames(base, 0, 0)).toBe(base);
    expect(reorderFrames(base, 0, 9)).toBe(base);
  });
});

describe('removeMove', () => {
  it('dissolves a frame left with a single member', () => {
    const moves = [move('a', 'LF', 7), move('b', 'RF', 7), move('c')];
    const next = removeMove(moves, 'b');
    expect(keys(next)).toEqual(['a', 'c']);
    expect(groupIds(next)).toEqual([null, null]);
  });

  it('keeps a frame grouped when 2+ members remain', () => {
    const moves = [move('a', 'LH', 7), move('b', 'LF', 7), move('c', 'RF', 7)];
    const next = removeMove(moves, 'a');
    expect(groupIds(next)).toEqual([7, 7]);
  });
});

describe('addToFrame', () => {
  it('adds a solo move to a frame, placed after its last member', () => {
    const moves = [move('a', 'LF', 7), move('b', 'RF', 7), move('c', 'LH')];
    const next = addToFrame(moves, 'c', 7);
    expect(keys(next)).toEqual(['a', 'b', 'c']);
    expect(groupIds(next)).toEqual([7, 7, 7]);
  });

  it('rejects when the frame already holds the limb', () => {
    const moves = [move('a', 'LF', 7), move('b', 'RF', 7), move('c', 'LF')];
    expect(addToFrame(moves, 'c', 7)).toBe(moves);
  });
});

describe('removeFromFrame', () => {
  it('ungroups a member and dissolves a 2-member frame', () => {
    const moves = [move('a', 'LF', 7), move('b', 'RF', 7)];
    expect(groupIds(removeFromFrame(moves, 'a'))).toEqual([null, null]);
  });

  it('keeps the frame grouped when 2+ members remain', () => {
    const moves = [move('a', 'LH', 7), move('b', 'LF', 7), move('c', 'RF', 7)];
    const next = removeFromFrame(moves, 'a');
    expect(framesOf(next).map(keys)).toEqual([['b', 'c'], ['a']]);
    expect(next.find((m) => m.key === 'a')!.groupId).toBeNull();
  });
});

describe('groupMoves', () => {
  it('promotes two solo moves into a new frame', () => {
    const moves = [move('a', 'LF'), move('b', 'RF')];
    const next = groupMoves(moves, ['a', 'b']);
    expect(groupIds(next)).toEqual([1, 1]);
  });

  it('rejects duplicate limbs and singletons', () => {
    expect(groupMoves([move('a', 'LF'), move('b', 'LF')], ['a', 'b'])).toEqual([
      move('a', 'LF'),
      move('b', 'LF'),
    ]);
    const single = [move('a')];
    expect(groupMoves(single, ['a'])).toBe(single);
  });
});

describe('initial 4-limb seeding', () => {
  const stance = [move('a', 'LH'), move('b', 'RH'), move('c', 'LF'), move('d', 'RF')];

  it('placedLimbs returns the distinct limbs in the draft', () => {
    expect(placedLimbs([move('a', 'LH'), move('b', 'LH'), move('c', 'RF')])).toEqual(
      new Set<Limb>(['LH', 'RF']),
    );
  });

  it('is seeding until all four limbs are placed', () => {
    expect(isSeeding([])).toBe(true);
    expect(isSeeding([move('a', 'LH'), move('b', 'RH'), move('c', 'LF')])).toBe(true);
    expect(isSeeding(stance)).toBe(false);
  });

  it('a duplicated limb does not count toward the four', () => {
    expect(isSeeding([move('a', 'LH'), move('b', 'LH'), move('c', 'RH'), move('d', 'LF')])).toBe(
      true,
    );
  });

  it('advances LH -> RH -> LF -> RF, skipping placed limbs', () => {
    expect(nextSeedLimb('LH', [move('a', 'LH')])).toBe('RH');
    expect(nextSeedLimb('RH', [move('a', 'LH'), move('b', 'RH')])).toBe('LF');
    expect(nextSeedLimb('LF', [move('a', 'LH'), move('b', 'RH'), move('c', 'LF')])).toBe('RF');
  });

  it('wraps around to find the first unplaced limb when starting elsewhere', () => {
    // Started with RF; only RF placed — next should wrap to LH.
    expect(nextSeedLimb('RF', [move('a', 'RF')])).toBe('LH');
  });

  it('returns the current limb once every limb is placed', () => {
    expect(nextSeedLimb('RF', stance)).toBe('RF');
  });
});
