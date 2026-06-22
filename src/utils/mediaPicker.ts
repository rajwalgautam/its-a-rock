import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { assetToMediaItem } from './mediaUtils';
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
 * Celebrate a send and offer to attach a video. Calls `onYes` when the user
 * opts in (which should immediately open the video picker).
 */
export function confirmAddVideo(onYes: () => void): void {
  Alert.alert('Nice send! 🎉', 'Want to add a video of your send?', [
    { text: 'Not now', style: 'cancel' },
    { text: 'Add video', onPress: onYes },
  ]);
}
