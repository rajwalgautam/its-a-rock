import { useState } from 'react';
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

/** Centered bottom `+` FAB with popup photo selection menu above. */
export function FloatingAddButton({ onPress, style }: FloatingAddButtonProps): React.JSX.Element {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  async function pickFromLibrary(): Promise<void> {
    setMenuOpen(false);
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
    setMenuOpen(false);
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

  function toggleMenu(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuOpen(!menuOpen);
  }

  return (
    <View style={[styles.container, style]}>
      {menuOpen && (
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
      )}
      {menuOpen && (
        <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => void takePhoto()}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Ionicons name="camera-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => void pickFromLibrary()} style={styles.menuItem}>
            <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Photo Library</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        onPress={toggleMenu}
        accessibilityRole="button"
        accessibilityLabel="Add a climb"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          SHADOW.md,
        ]}
      >
        <Ionicons name="add" size={32} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position: 'absolute',
    bottom: 80,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
