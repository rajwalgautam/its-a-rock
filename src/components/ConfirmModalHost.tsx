import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useConfirmStore } from '@/store/useConfirmStore';

/**
 * App-wide host for the themed confirm dialog. Renders a centered, themed modal
 * matching the delete-confirmation dialog whenever {@link useConfirmStore} has a
 * pending request. Mounted once at the app root.
 */
export function ConfirmModalHost(): React.JSX.Element {
  const { colors } = useTheme();
  const request = useConfirmStore((s) => s.request);
  const resolve = useConfirmStore((s) => s.resolve);

  const visible = request !== null;
  const confirmLabel = request?.confirmLabel ?? 'OK';
  const cancelLabel = request?.cancelLabel ?? 'Cancel';
  const confirmColor = request?.destructive ? colors.danger : colors.primary;
  const confirmTextColor = request?.destructive ? '#FFFFFF' : colors.onPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => resolve(false)}>
      <Pressable style={styles.backdrop} onPress={() => resolve(false)}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.md]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{request?.title}</Text>
          {request?.message !== undefined && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{request.message}</Text>
          )}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => resolve(false)}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: confirmColor }]} onPress={() => resolve(true)}>
              <Text style={[styles.buttonText, { color: confirmTextColor }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
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
  dialog: {
    width: '100%',
    maxWidth: 440,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  message: {
    fontSize: FONT_SIZE.md,
    lineHeight: FONT_SIZE.md * 1.4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
