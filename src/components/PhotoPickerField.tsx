import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** If true, hide the picker buttons when a photo is already selected. */
  hideButtonsWhenSelected?: boolean;
}

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: false,
};

/** Pick from the library or take a photo; stores a local URI + dimensions. */
export function PhotoPickerField({ value, onChange, hideButtonsWhenSelected }: PhotoPickerFieldProps): React.JSX.Element {
  const { colors } = useTheme();
  const showButtons = !hideButtonsWhenSelected || value === null;

  async function pickFromLibrary(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a climb photo.');
      return;
    }
    apply(await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS));
  }

  async function takePhoto(): Promise<void> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a climb photo.');
      return;
    }
    apply(await ImagePicker.launchCameraAsync(PICK_OPTIONS));
  }

  function apply(result: ImagePicker.ImagePickerResult): void {
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset === undefined) return;
    onChange({ uri: asset.uri, width: asset.width ?? null, height: asset.height ?? null });
  }

  return (
    <View style={styles.container}>
      {value !== null ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="cover" />
          <Pressable
            onPress={() => onChange(null)}
            style={[styles.removeBtn, { backgroundColor: colors.overlay }]}
            accessibilityLabel="Remove photo"
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.onOverlay} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.tilePlaceholder }]}>
          <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        </View>
      )}

      {showButtons && (
        <View style={styles.actions}>
          <PickerButton icon="images-outline" label="Library" onPress={() => void pickFromLibrary()} />
          <PickerButton icon="camera-outline" label="Camera" onPress={() => void takePhoto()} />
        </View>
      )}
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
  removeBtn: {
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
});
