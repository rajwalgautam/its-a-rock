import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
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

const MENU_WIDTH = 200;
const MENU_HEIGHT = 100;

/** Prominent bottom-centered `+` FAB with photo selection menu. */
export function FloatingAddButton({ onPress, style }: FloatingAddButtonProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<View>(null);

  async function pickFromLibrary(): Promise<void> {
    setMenuVisible(false);
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
    setMenuVisible(false);
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
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
    setMenuVisible(!menuVisible);
  }

  const menuLeft = (screenWidth - MENU_WIDTH) / 2;

  return (
    <>
      {menuVisible && (
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <View
            ref={menuRef}
            style={[
              styles.menu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                left: menuLeft,
              },
            ]}
          >
            <MenuItem
              label="Camera"
              icon="camera"
              onPress={() => void takePhoto()}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              label="Photo Library"
              icon="image"
              onPress={() => void pickFromLibrary()}
              colors={colors}
            />
          </View>
        </Pressable>
      )}
      <Pressable
        onPress={toggleMenu}
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
    </>
  );
}

interface MenuItemProps {
  label: string;
  icon: string;
  onPress: () => void;
  colors: any;
}

function MenuItem({ label, icon, onPress, colors }: MenuItemProps): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons
        name={icon as any}
        size={16}
        color={colors.textPrimary}
        style={styles.menuIcon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    bottom: SPACING.lg + 60 + SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: MENU_WIDTH,
  },
  menuItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
  },
  menuIcon: {
    marginLeft: SPACING.sm,
  },
  divider: {
    height: 1,
  },
});
