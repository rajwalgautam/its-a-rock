import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { assetToMediaItem } from '@/utils/mediaUtils';
import type { MediaItem } from '@/types';

interface MediaCaptureMenuProps {
  visible: boolean;
  /** Called with the chosen media; the menu closes regardless. */
  onPick: (item: MediaItem) => void;
  onClose: () => void;
}

const LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images', 'videos'],
  quality: 0.8,
};

const CAMERA_PHOTO_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: true,
};

const CAMERA_VIDEO_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['videos'],
  quality: 0.8,
};

/**
 * The same Camera / Record Video / Library action sheet the floating add button
 * uses, returning a single picked media item. Reused by the note authoring flow.
 */
export function MediaCaptureMenu({
  visible,
  onPick,
  onClose,
}: MediaCaptureMenuProps): React.JSX.Element {
  const { colors } = useTheme();

  function handle(result: ImagePicker.ImagePickerResult): void {
    onClose();
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset === undefined) return;
    onPick(assetToMediaItem(asset));
  }

  async function pickFromLibrary(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow library access to attach a photo or video.');
      onClose();
      return;
    }
    handle(await ImagePicker.launchImageLibraryAsync(LIBRARY_OPTIONS));
  }

  async function capture(options: ImagePicker.ImagePickerOptions): Promise<void> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture a photo or video.');
      onClose();
      return;
    }
    handle(await ImagePicker.launchCameraAsync(options));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View pointerEvents="box-none" style={[styles.menu, { backgroundColor: colors.surface }]}>
        <Row icon="camera-outline" label="Camera" onPress={() => void capture(CAMERA_PHOTO_OPTIONS)} border />
        <Row
          icon="videocam-outline"
          label="Record Video"
          onPress={() => void capture(CAMERA_VIDEO_OPTIONS)}
          border
        />
        <Row icon="images-outline" label="Library" onPress={() => void pickFromLibrary()} />
        <Pressable onPress={onClose} style={[styles.cancel, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.cancelLabel, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Row({
  icon,
  label,
  onPress,
  border = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  border?: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, border && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  cancel: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
