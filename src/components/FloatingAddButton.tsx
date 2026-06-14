import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface FloatingAddButtonProps {
  onPress: (photoUri?: string) => void;
  /** Extra positioning overrides (e.g. to clear the tab bar). */
  style?: ViewStyle;
}

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: false,
};

/** Prominent bottom-right `+` FAB with photo selection menu. */
export function FloatingAddButton({ onPress, style }: FloatingAddButtonProps): React.JSX.Element {
  const { colors } = useTheme();

  async function pickFromLibrary(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a climb photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset === undefined) return;
    onPress(asset.uri);
  }

  async function takePhoto(): Promise<void> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a climb photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset === undefined) return;
    onPress(asset.uri);
  }

  function showMenu(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Add a climb', undefined, [
      {
        text: 'Camera',
        onPress: () => void takePhoto(),
      },
      {
        text: 'Photo Library',
        onPress: () => void pickFromLibrary(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }

  return (
    <Pressable
      onPress={showMenu}
      accessibilityRole="button"
      accessibilityLabel="Add a climb"
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        SHADOW.md,
        style,
      ]}
    >
      <Ionicons name="add" size={32} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
