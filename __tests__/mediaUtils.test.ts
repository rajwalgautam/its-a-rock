import {
  addMedia,
  assetToMediaItem,
  coverItem,
  moveMedia,
  removeMediaAt,
  setCover,
} from '@/utils/mediaUtils';
import type { MediaItem } from '@/types';

const photo = (uri: string): MediaItem => ({ uri, type: 'photo', width: 10, height: 20 });
const video = (uri: string): MediaItem => ({ uri, type: 'video', width: null, height: null });

describe('assetToMediaItem', () => {
  it('treats an explicit video asset as video', () => {
    expect(assetToMediaItem({ uri: 'v', type: 'video' }).type).toBe('video');
  });

  it('infers video from a positive duration when type is absent', () => {
    expect(assetToMediaItem({ uri: 'v', duration: 1200 }).type).toBe('video');
  });

  it('defaults to photo', () => {
    const item = assetToMediaItem({ uri: 'p', width: 4, height: 8 });
    expect(item).toEqual({ uri: 'p', type: 'photo', width: 4, height: 8 });
  });

  it('normalizes missing dimensions to null', () => {
    expect(assetToMediaItem({ uri: 'p' })).toEqual({
      uri: 'p',
      type: 'photo',
      width: null,
      height: null,
    });
  });
});

describe('addMedia', () => {
  it('appends new items', () => {
    expect(addMedia([photo('a')], [photo('b')])).toHaveLength(2);
  });

  it('skips items whose uri is already present', () => {
    const result = addMedia([photo('a')], [photo('a'), photo('b')]);
    expect(result.map((m) => m.uri)).toEqual(['a', 'b']);
  });

  it('dedupes within the additions themselves', () => {
    const result = addMedia([], [photo('a'), photo('a')]);
    expect(result).toHaveLength(1);
  });

  it('returns the same array when nothing is added', () => {
    const list = [photo('a')];
    expect(addMedia(list, [photo('a')])).toBe(list);
  });
});

describe('removeMediaAt', () => {
  it('removes the item at the index', () => {
    expect(removeMediaAt([photo('a'), photo('b')], 0).map((m) => m.uri)).toEqual(['b']);
  });

  it('ignores out-of-range indexes', () => {
    const list = [photo('a')];
    expect(removeMediaAt(list, 5)).toBe(list);
  });
});

describe('moveMedia', () => {
  it('moves an item forward', () => {
    const r = moveMedia([photo('a'), photo('b'), photo('c')], 2, 0);
    expect(r.map((m) => m.uri)).toEqual(['c', 'a', 'b']);
  });

  it('moves an item backward', () => {
    const r = moveMedia([photo('a'), photo('b'), photo('c')], 0, 1);
    expect(r.map((m) => m.uri)).toEqual(['b', 'a', 'c']);
  });

  it('is a no-op for equal or out-of-range indices', () => {
    const list = [photo('a'), photo('b')];
    expect(moveMedia(list, 1, 1)).toBe(list);
    expect(moveMedia(list, -1, 0)).toBe(list);
    expect(moveMedia(list, 0, 9)).toBe(list);
  });
});

describe('setCover', () => {
  it('promotes the chosen item to the front', () => {
    expect(setCover([photo('a'), photo('b'), photo('c')], 2).map((m) => m.uri)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});

describe('coverItem', () => {
  it('returns the first photo in order', () => {
    expect(coverItem([video('v'), photo('p1'), photo('p2')])?.uri).toBe('p1');
  });

  it('returns null when there are only videos', () => {
    expect(coverItem([video('v1'), video('v2')])).toBeNull();
  });

  it('returns null for an empty gallery', () => {
    expect(coverItem([])).toBeNull();
  });
});
