import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface HelpSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** One labeled tip in the help sheet. */
interface Tip {
  title: string;
  body: string;
}

/**
 * Static "how the planner works" copy. Wording mirrors the on-canvas hints so
 * the two stay consistent. Kept as data so the layout below is trivial.
 */
const TIPS: readonly Tip[] = [
  {
    title: 'Place a limb',
    body: 'Pick a limb below, then tap the wall to drop it. New plans start by placing all four limbs (hand → hand → foot → foot).',
  },
  {
    title: 'Adjust a move',
    body: 'Drag any marker to fine-tune where it sits. Tap it to select it, or open the sequence list to delete or reorder.',
  },
  {
    title: 'Group moves',
    body: 'Turn on grouping to place limbs that move together as one frame — handy for matches and bumps. Turn it off for solo moves.',
  },
  {
    title: 'Play it back',
    body: 'Press play to step through the route one frame at a time and watch the moving limbs light up.',
  },
  {
    title: 'Bubble size',
    body: 'Use the size control to grow or shrink the markers so they fit the holds in your photo.',
  },
];

/**
 * A bottom-sheet popup giving a brief overview of the route planner and its
 * controls. Built on the same `Modal` pattern as `MoveList` for consistency.
 */
export function HelpSheet({ visible, onClose }: HelpSheetProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close help" />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Route planner</Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close help">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Map out the beta for a move: mark where each hand and foot goes, group limbs that move
            together, then play it back.
          </Text>
          {TIPS.map((tip) => (
            <View key={tip.title} style={styles.tip}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{tip.title}</Text>
              <Text style={[styles.tipBody, { color: colors.textSecondary }]}>{tip.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
  body: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  intro: {
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.4,
  },
  tip: {
    gap: 2,
  },
  tipTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  tipBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.4,
  },
});
