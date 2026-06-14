import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

export interface PhotoValue {
  uri: string;
  width: number | null;
  height: number | null;
}

interface PhotoPickerFieldProps {
  value: PhotoValue | null;
  onChange: (value: PhotoValue | null) => void;
}

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: false,
};

/** Pick from the library or take a photo; stores a local URI + dimensions. */
export function PhotoPickerField({ value, onChange }: PhotoPickerFieldProps): React.JSX.Element {
  const { colors } = useTheme();
  const [showEditMenu, setShowEditMenu] = useState(false);

  async function pickFromLibrary(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a climb photo.');
      return;
    }
    apply(await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS));
  }

  async function takePhoto(): Promise<void> {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a climb photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset === undefined) return;

    const libraryPerm = await MediaLibrary.requestPermissionsAsync();
    if (!libraryPerm.granted) {
      Alert.alert('Permission needed', 'Allow access to save photos to your library.');
      return;
    }

    try {
      const savedAsset = await MediaLibrary.createAssetAsync(asset.uri);
      const photoUri = savedAsset.uri;
      onChange({
        uri: photoUri,
        width: asset.width ?? null,
        height: asset.height ?? null,
      });
      setShowEditMenu(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo to library.');
      console.error('Failed to save photo:', error);
    }
  }

  function apply(result: ImagePicker.ImagePickerResult): void {
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset === undefined) return;
    onChange({ uri: asset.uri, width: asset.width ?? null, height: asset.height ?? null });
    setShowEditMenu(false);
  }

  return (
    <View style={styles.container}>
      {value !== null ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="cover" />
          <Pressable
            onPress={() => setShowEditMenu(true)}
            style={[styles.editBtn, { backgroundColor: colors.overlay }]}
            accessibilityLabel="Edit photo"
            hitSlop={8}
          >
            <Ionicons name="pencil" size={18} color={colors.onOverlay} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.placeholder, { backgroundColor: colors.tilePlaceholder }]}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
          </View>
          <View style={styles.actions}>
            <PickerButton icon="images-outline" label="Library" onPress={() => void pickFromLibrary()} />
            <PickerButton icon="camera-outline" label="Camera" onPress={() => void takePhoto()} />
          </View>
        </>
      )}

      <EditPhotoModal
        isVisible={showEditMenu}
        onLibrary={() => void pickFromLibrary()}
        onCamera={() => void takePhoto()}
        onRemove={() => {
          onChange(null);
          setShowEditMenu(false);
        }}
        onCancel={() => setShowEditMenu(false)}
      />
    </View>
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

function EditPhotoModal({
  isVisible,
  onLibrary,
  onCamera,
  onRemove,
  onCancel,
}: {
  isVisible: boolean;
  onLibrary: () => void;
  onCamera: () => void;
  onRemove: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={onCancel} />
      <View pointerEvents="box-none" style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={onLibrary}
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Choose from library</Text>
        </Pressable>
        <Pressable
          onPress={onCamera}
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="camera-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Take a photo</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={styles.menuItem}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Remove photo</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={[styles.menuCancel, { backgroundColor: colors.surfaceAlt }]}
        >
          <Text style={[styles.menuCancelLabel, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  previewWrap: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
  },
  editBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomWidth: 1,
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
