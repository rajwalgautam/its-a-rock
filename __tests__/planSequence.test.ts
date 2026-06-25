import {
  appendMove,
  removeMove,
  reorderMoves,
  toInputs,
  updateMovePosition,
  type DraftMove,
} from '@/utils/planSequence';
import type { Limb } from '@/types';

function move(key: string, limb: Limb = 'LH'): DraftMove {
  return { key, limb, x: 0.5, y: 0.5, holdId: null };
}

const keys = (moves: DraftMove[]): string[] => moves.map((m) => m.key);

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
    const moves = [
      { key: 'a', limb: 'RH' as Limb, x: 0.2, y: 0.3, holdId: 7 },
      { key: 'b', limb: 'LF' as Limb, x: 0.8, y: 0.9, holdId: null },
    ];
    expect(toInputs(moves)).toEqual([
      { limb: 'RH', x: 0.2, y: 0.3, holdId: 7 },
      { limb: 'LF', x: 0.8, y: 0.9, holdId: null },
    ]);
  });
});
