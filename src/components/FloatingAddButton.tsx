import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface FloatingAddButtonProps {
  onPress: () => void;
  /** Extra positioning overrides (e.g. to clear the tab bar). */
  style?: ViewStyle;
}

/** Prominent bottom-right `+` FAB with haptic feedback on press. */
export function FloatingAddButton({ onPress, style }: FloatingAddButtonProps): React.JSX.Element {
  const { colors } = useTheme();

  function handlePress(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
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
