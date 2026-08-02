import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_ICON, LIMB_ICON_FLIP, LIMB_NAME, LIMB_ORDER, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import { contrastColor } from '@/utils/color';
import type { Limb } from '@/types';

interface LimbSelectorProps {
  active: Limb;
  onChange: (limb: Limb) => void;
  /** Limbs to offer; defaults to all four. Hands-only plans pass just the hands. */
  limbs?: readonly Limb[];
}

/** Row of limb buttons (hand/foot icons) choosing which limb the next tap places. */
export function LimbSelector({
  active,
  onChange,
  limbs = LIMB_ORDER,
}: LimbSelectorProps): React.JSX.Element {
  const { colors } = useTheme();
  const limbSides = {
    left: useSettingsStore((s) => s.limbColorLeft),
    right: useSettingsStore((s) => s.limbColorRight),
  };

  return (
    <View style={styles.row}>
      {limbs.map((limb) => {
        const color = limbColor(limbSides, limb);
        // The chip is always filled with the actual marker color (so the swatch
        // is visible even when it's white), the glyph drawn in whichever of
        // black/white reads on it, and the active limb gets a primary ring.
        const isActive = limb === active;
        return (
          <Pressable
            key={limb}
            onPress={() => onChange(limb)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={LIMB_NAME[limb]}
          >
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: color,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 3 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={LIMB_ICON[limb]}
                size={24}
                color={contrastColor(color)}
                style={LIMB_ICON_FLIP[limb] ? styles.flip : undefined}
              />
            </View>
            <Text
              style={[styles.name, { color: isActive ? colors.textPrimary : colors.textMuted }]}
              numberOfLines={1}
            >
              {LIMB_NAME[limb]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  chip: {
    width: 52,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  name: {
    fontSize: FONT_SIZE.xs,
  },
});
