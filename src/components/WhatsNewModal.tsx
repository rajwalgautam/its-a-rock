import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Markdown } from '@/components/Markdown';

interface WhatsNewModalProps {
  visible: boolean;
  version: string;
  notes: string;
  onDismiss: () => void;
}

/** Post-update "What's new" popup showing the current release's notes. */
export function WhatsNewModal({
  visible,
  version,
  notes,
  onDismiss,
}: WhatsNewModalProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.md]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            What&apos;s new in v{version.replace(/^v/, '')}
          </Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Markdown source={notes} />
          </ScrollView>
          <Pressable
            onPress={onDismiss}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
