import type { MediaItem } from '@/types';

/** Subset of an `expo-image-picker` asset we care about. */
export interface PickedAsset {
  uri: string;
  width?: number | null;
  height?: number | null;
  /** 'image' | 'video' on newer pickers; absent on older ones. */
  type?: string | null;
  /** Present (ms) for videos. */
  duration?: number | null;
}

/** Map a picker asset to a form MediaItem, inferring photo vs. video. */
export function assetToMediaItem(asset: PickedAsset): MediaItem {
  const isVideo =
    asset.type === 'video' || (asset.duration != null && asset.duration > 0);
  return {
    uri: asset.uri,
    type: isVideo ? 'video' : 'photo',
    width: asset.width ?? null,
    height: asset.height ?? null,
  };
}

/** Append items, skipping any whose URI is already in the list. */
export function addMedia(list: MediaItem[], items: MediaItem[]): MediaItem[] {
  const seen = new Set(list.map((m) => m.uri));
  const additions = items.filter((m) => {
    if (seen.has(m.uri)) return false;
    seen.add(m.uri);
    return true;
  });
  return additions.length > 0 ? [...list, ...additions] : list;
}

export function removeMediaAt(list: MediaItem[], index: number): MediaItem[] {
  if (index < 0 || index >= list.length) return list;
  return list.filter((_, i) => i !== index);
}

/** Move the item at `from` to `to`, shifting the rest. */
export function moveMedia(list: MediaItem[], from: number, to: number): MediaItem[] {
  if (
    from < 0 ||
    from >= list.length ||
    to < 0 ||
    to >= list.length ||
    from === to
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Promote an item to the front of the gallery (position 0 = cover). */
export function setCover(list: MediaItem[], index: number): MediaItem[] {
  return moveMedia(list, index, 0);
}

/** The cover used for tiles/cards: the first photo, or null if videos-only. */
export function coverItem(list: MediaItem[]): MediaItem | null {
  return list.find((m) => m.type === 'photo') ?? null;
}
