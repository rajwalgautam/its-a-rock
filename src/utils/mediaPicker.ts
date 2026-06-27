import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { assetToMediaItem } from './mediaUtils';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { MediaItem } from '@/types';

/** Pick a single video from the library, handling permissions. */
export async function pickVideoFromLibrary(): Promise<MediaItem | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow library access to attach a video.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    quality: 0.8,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset === undefined ? null : assetToMediaItem(asset);
}

/**
 * Celebrate a send and offer to attach a video via the themed confirm dialog.
 * Calls `onYes` when the user opts in (which should immediately open the video
 * picker).
 */
export function confirmAddVideo(onYes: () => void): void {
  void useConfirmStore
    .getState()
    .confirm({
      title: 'Nice send! 🎉',
      message: 'Want to add a video of your send?',
      confirmLabel: 'Add video',
      cancelLabel: 'Not now',
    })
    .then((confirmed) => {
      if (confirmed) onYes();
    });
}
