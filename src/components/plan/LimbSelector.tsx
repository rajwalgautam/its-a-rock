import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_ICON, LIMB_ICON_FLIP, LIMB_NAME, LIMB_ORDER, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import type { Limb } from '@/types';

interface LimbSelectorProps {
  active: Limb;
  onChange: (limb: Limb) => void;
}

/** Row of limb buttons (hand/foot icons) choosing which limb the next tap places. */
export function LimbSelector({ active, onChange }: LimbSelectorProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {LIMB_ORDER.map((limb) => {
        const color = limbColor(colors, limb);
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
                { borderColor: color, backgroundColor: isActive ? color : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons
                name={LIMB_ICON[limb]}
                size={24}
                color={isActive ? '#FFFFFF' : color}
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
    borderWidth: 2,
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
