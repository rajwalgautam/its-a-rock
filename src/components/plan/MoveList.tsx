import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_LABEL, LIMB_NAME, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import { framesOf, type DraftMove } from '@/utils/planSequence';

interface MoveListProps {
  visible: boolean;
  onClose: () => void;
  moves: DraftMove[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Reorder whole frames by frame index. */
  onReorder: (from: number, to: number) => void;
  onRemove: (key: string) => void;
  /** Promote the given moves into a new frame. */
  onGroup: (keys: string[]) => void;
  /** Add a solo move to an existing frame. */
  onAddToFrame: (key: string, groupId: number) => void;
  /** Make a frame member solo again. */
  onRemoveFromFrame: (key: string) => void;
}

/** Bottom sheet listing the move sequence as frames, with grouping controls. */
export function MoveList({
  visible,
  onClose,
  moves,
  selectedKey,
  onSelect,
  onReorder,
  onRemove,
  onGroup,
  onAddToFrame,
  onRemoveFromFrame,
}: MoveListProps): React.JSX.Element {
  const { colors } = useTheme();
  const frames = framesOf(moves);

  /** Group a solo frame with its neighbour: join an adjacent frame, else pair. */
  function groupWithNeighbour(frameIndex: number): void {
    const solo = frames[frameIndex]?.[0];
    const neighbour = frames[frameIndex + 1] ?? frames[frameIndex - 1];
    if (solo === undefined || neighbour === undefined) return;
    const neighbourGroupId = neighbour[0]!.groupId;
    if (neighbourGroupId !== null) {
      onAddToFrame(solo.key, neighbourGroupId);
    } else {
      onGroup([solo.key, neighbour[0]!.key]);
    }
  }

  // Running move number so list badges match the canvas (1-based over all moves).
  let moveNumber = 0;

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

        {frames.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No moves yet. Tap the wall to add the first one.
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {frames.map((frame, fi) => {
              const grouped = frame.length > 1;
              const frameStart = moveNumber + 1;
              moveNumber += frame.length;
              return (
                <View
                  key={frame[0]!.key}
                  style={[
                    grouped && styles.frame,
                    grouped && { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  {grouped && (
                    <View style={styles.frameHeader}>
                      <Text style={[styles.frameLabel, { color: colors.primary }]}>
                        Frame {fi + 1} · moves together
                      </Text>
                      <View style={styles.controls}>
                        <RowControl
                          icon="chevron-up"
                          label="Move frame earlier"
                          disabled={fi === 0}
                          onPress={() => onReorder(fi, fi - 1)}
                        />
                        <RowControl
                          icon="chevron-down"
                          label="Move frame later"
                          disabled={fi === frames.length - 1}
                          onPress={() => onReorder(fi, fi + 1)}
                        />
                      </View>
                    </View>
                  )}

                  {frame.map((m, mi) => {
                    const color = limbColor(colors, m.limb);
                    const selected = m.key === selectedKey;
                    const index = frameStart + mi;
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
                        <Text style={[styles.index, { color: colors.textMuted }]}>{index}</Text>
                        <View style={[styles.chip, { backgroundColor: color }]}>
                          <Text style={styles.chipText}>{LIMB_LABEL[m.limb]}</Text>
                        </View>
                        <Text style={[styles.name, { color: colors.textPrimary }]}>
                          {LIMB_NAME[m.limb]}
                        </Text>
                        <View style={styles.controls}>
                          {grouped ? (
                            <RowControl
                              icon="git-branch"
                              label="Remove from frame"
                              onPress={() => onRemoveFromFrame(m.key)}
                            />
                          ) : (
                            <>
                              <RowControl
                                icon="chevron-up"
                                label="Move earlier"
                                disabled={fi === 0}
                                onPress={() => onReorder(fi, fi - 1)}
                              />
                              <RowControl
                                icon="chevron-down"
                                label="Move later"
                                disabled={fi === frames.length - 1}
                                onPress={() => onReorder(fi, fi + 1)}
                              />
                              <RowControl
                                icon="git-merge"
                                label="Group with neighbouring move"
                                disabled={frames.length < 2}
                                onPress={() => groupWithNeighbour(fi)}
                              />
                            </>
                          )}
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
                </View>
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
  frame: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  frameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.xs,
  },
  frameLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
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
