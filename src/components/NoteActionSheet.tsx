import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { RouteNote } from '@/types';

interface NoteActionSheetProps {
  /** The note being acted on, or null when the sheet is closed. */
  note: RouteNote | null;
  onClose: () => void;
  /** Edit the note's text (and the rest of the climb). */
  onEditNote: (note: RouteNote) => void;
  /** Open the planner for the note's photo. */
  onEditPlan: (note: RouteNote) => void;
}

/**
 * Bottom-sheet choice shown when a note on the climb card is tapped: edit the
 * note's text, or (for a photo note) edit its move plan.
 */
export function NoteActionSheet({
  note,
  onClose,
  onEditNote,
  onEditPlan,
}: NoteActionSheetProps): React.JSX.Element {
  const { colors } = useTheme();
  const canPlan = note?.media != null && note.media.type === 'photo';

  return (
    <Modal visible={note !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View pointerEvents="box-none" style={[styles.menu, { backgroundColor: colors.surface }]}>
        <Row
          icon="create-outline"
          label="Edit note"
          onPress={() => {
            if (note !== null) onEditNote(note);
          }}
          border
        />
        {canPlan && (
          <Row
            icon="footsteps-outline"
            label={note?.hasPlan === true ? 'Edit plan' : 'Add plan'}
            onPress={() => {
              if (note !== null) onEditPlan(note);
            }}
          />
        )}
        <Pressable onPress={onClose} style={[styles.cancel, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.cancelLabel, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Row({
  icon,
  label,
  onPress,
  border = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  border?: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, border && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  cancel: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
