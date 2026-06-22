import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import {
  addMedia,
  assetToMediaItem,
  coverItem,
  moveMedia,
  removeMediaAt,
  setCover,
} from '@/utils/mediaUtils';
import type { MediaItem } from '@/types';

interface MediaGalleryFieldProps {
  value: MediaItem[];
  onChange: (value: MediaItem[]) => void;
}

const LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images', 'videos'],
  quality: 0.8,
  allowsMultipleSelection: true,
  selectionLimit: 0,
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

/** Gallery editor: add photos/videos, reorder, set a cover, and remove. */
export function MediaGalleryField({ value, onChange }: MediaGalleryFieldProps): React.JSX.Element {
  const { colors } = useTheme();
  const [addMenu, setAddMenu] = useState(false);

  const cover = coverItem(value);

  function applyAssets(result: ImagePicker.ImagePickerResult): void {
    setAddMenu(false);
    if (result.canceled) return;
    const items = result.assets.map(assetToMediaItem);
    onChange(addMedia(value, items));
  }

  async function pickFromLibrary(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow library access to attach photos or videos.');
      return;
    }
    applyAssets(await ImagePicker.launchImageLibraryAsync(LIBRARY_OPTIONS));
  }

  async function captureFromCamera(options: ImagePicker.ImagePickerOptions): Promise<void> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture a photo or video.');
      return;
    }
    applyAssets(await ImagePicker.launchCameraAsync(options));
  }

  return (
    <View style={styles.container}>
      {value.length === 0 ? (
        <View style={[styles.placeholder, { backgroundColor: colors.tilePlaceholder }]}>
          <Ionicons name="images-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            Add photos and videos
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {value.map((item, i) => (
            <Thumbnail
              key={`${item.uri}-${i}`}
              item={item}
              isCover={cover !== null && item.uri === cover.uri}
              canMoveLeft={i > 0}
              canMoveRight={i < value.length - 1}
              onMoveLeft={() => onChange(moveMedia(value, i, i - 1))}
              onMoveRight={() => onChange(moveMedia(value, i, i + 1))}
              onSetCover={() => onChange(setCover(value, i))}
              onRemove={() => onChange(removeMediaAt(value, i))}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <PickerButton icon="images-outline" label="Library" onPress={() => void pickFromLibrary()} />
        <PickerButton icon="add" label="Capture" onPress={() => setAddMenu(true)} />
      </View>

      <AddMenu
        visible={addMenu}
        onLibrary={() => void pickFromLibrary()}
        onPhoto={() => void captureFromCamera(CAMERA_PHOTO_OPTIONS)}
        onVideo={() => void captureFromCamera(CAMERA_VIDEO_OPTIONS)}
        onCancel={() => setAddMenu(false)}
      />
    </View>
  );
}

function Thumbnail({
  item,
  isCover,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onSetCover,
  onRemove,
}: {
  item: MediaItem;
  isCover: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetCover: () => void;
  onRemove: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.thumbWrap}>
      <View style={[styles.thumb, { backgroundColor: colors.tilePlaceholder }]}>
        {item.type === 'photo' ? (
          <Image source={{ uri: item.uri }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbImage, styles.videoThumb]}>
            <Ionicons name="play-circle" size={32} color={colors.onOverlay} />
          </View>
        )}

        {isCover && (
          <View style={[styles.coverBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.coverText, { color: colors.onPrimary }]}>Cover</Text>
          </View>
        )}

        <Pressable
          onPress={onRemove}
          style={[styles.removeBtn, { backgroundColor: colors.overlay }]}
          accessibilityLabel="Remove item"
          hitSlop={6}
        >
          <Ionicons name="close" size={16} color={colors.onOverlay} />
        </Pressable>
      </View>

      <View style={styles.thumbControls}>
        <ThumbControl icon="chevron-back" label="Move left" disabled={!canMoveLeft} onPress={onMoveLeft} />
        {!isCover && item.type === 'photo' && (
          <ThumbControl icon="star-outline" label="Set as cover" onPress={onSetCover} />
        )}
        <ThumbControl
          icon="chevron-forward"
          label="Move right"
          disabled={!canMoveRight}
          onPress={onMoveRight}
        />
      </View>
    </View>
  );
}

function ThumbControl({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.thumbControlBtn}
    >
      <Ionicons
        name={icon}
        size={18}
        color={disabled ? colors.textMuted : colors.textSecondary}
      />
    </Pressable>
  );
}

function PickerButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function AddMenu({
  visible,
  onLibrary,
  onPhoto,
  onVideo,
  onCancel,
}: {
  visible: boolean;
  onLibrary: () => void;
  onPhoto: () => void;
  onVideo: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={onCancel} />
      <View pointerEvents="box-none" style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
        <MenuRow icon="images-outline" label="Choose from library" onPress={onLibrary} border />
        <MenuRow icon="camera-outline" label="Take a photo" onPress={onPhoto} border />
        <MenuRow icon="videocam-outline" label="Record a video" onPress={onVideo} />
        <Pressable onPress={onCancel} style={[styles.menuCancel, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.menuCancelLabel, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function MenuRow({
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
      style={[styles.menuItem, border && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 100;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  placeholder: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  placeholderText: {
    fontSize: FONT_SIZE.sm,
  },
  row: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  thumbWrap: {
    gap: SPACING.xs,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  coverBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  coverText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumbControlBtn: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  menuCancel: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  menuCancelLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
