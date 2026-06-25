import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_LABEL, LIMB_NAME, LIMB_ORDER, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import type { Limb } from '@/types';

interface LimbSelectorProps {
  active: Limb;
  onChange: (limb: Limb) => void;
}

/** Pinned bottom bar to choose which limb the next tap/placement controls. */
export function LimbSelector({ active, onChange }: LimbSelectorProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACING.sm),
        },
      ]}
    >
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
              <Text style={[styles.code, { color: isActive ? '#FFFFFF' : color }]}>
                {LIMB_LABEL[limb]}
              </Text>
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
  bar: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  chip: {
    width: 44,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  name: {
    fontSize: FONT_SIZE.xs,
  },
});
