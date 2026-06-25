import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_LABEL, LIMB_NAME, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import type { DraftMove } from '@/utils/planSequence';

interface MoveListProps {
  visible: boolean;
  onClose: () => void;
  moves: DraftMove[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (key: string) => void;
}

/** Bottom sheet listing the ordered move sequence with reorder + delete. */
export function MoveList({
  visible,
  onClose,
  moves,
  selectedKey,
  onSelect,
  onReorder,
  onRemove,
}: MoveListProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Move sequence</Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close move list">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {moves.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No moves yet. Tap the wall to add the first one.
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {moves.map((m, i) => {
              const color = limbColor(colors, m.limb);
              const selected = m.key === selectedKey;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => onSelect(m.key)}
                  style={[
                    styles.row,
                    { borderColor: colors.border },
                    selected && { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Text style={[styles.index, { color: colors.textMuted }]}>{i + 1}</Text>
                  <View style={[styles.chip, { backgroundColor: color }]}>
                    <Text style={styles.chipText}>{LIMB_LABEL[m.limb]}</Text>
                  </View>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>
                    {LIMB_NAME[m.limb]}
                  </Text>
                  <View style={styles.controls}>
                    <RowControl
                      icon="chevron-up"
                      label="Move earlier"
                      disabled={i === 0}
                      onPress={() => onReorder(i, i - 1)}
                    />
                    <RowControl
                      icon="chevron-down"
                      label="Move later"
                      disabled={i === moves.length - 1}
                      onPress={() => onReorder(i, i + 1)}
                    />
                    <RowControl
                      icon="trash-outline"
                      label="Delete move"
                      tint={colors.danger}
                      onPress={() => onRemove(m.key)}
                    />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function RowControl({
  icon,
  label,
  disabled = false,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled?: boolean;
  tint?: string;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const color = disabled ? colors.textMuted : (tint ?? colors.textSecondary);
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={6} style={styles.control}>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  empty: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  index: {
    width: 20,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  control: {
    padding: SPACING.xs,
  },
});
