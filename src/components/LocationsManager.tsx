import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { validateGymName } from '@/utils/gymValidation';
import type { Gym } from '@/types';

/** Settings section: list, add, rename and delete climbing locations/gyms. */
export function LocationsManager(): React.JSX.Element {
  const { colors } = useTheme();
  const gyms = useRouteStore((s) => s.gyms);
  const loadGyms = useRouteStore((s) => s.loadGyms);
  const addGym = useRouteStore((s) => s.addGym);
  const editGym = useRouteStore((s) => s.editGym);
  const removeGym = useRouteStore((s) => s.removeGym);
  const routeCountForGym = useRouteStore((s) => s.routeCountForGym);
  const [editingGym, setEditingGym] = useState<Gym | 'new' | null>(null);

  useEffect(() => {
    void loadGyms();
  }, [loadGyms]);

  async function handleSave(name: string): Promise<void> {
    if (editingGym === 'new') {
      await addGym(name);
    } else if (editingGym !== null) {
      await editGym(editingGym.id, name);
    }
    setEditingGym(null);
  }

  async function confirmDelete(gym: Gym): Promise<void> {
    const count = await routeCountForGym(gym.id);
    const message =
      count > 0
        ? `${gym.name} has ${count} climb${count === 1 ? '' : 's'}. Deleting it will also delete ${count === 1 ? 'that climb' : 'those climbs'}. This cannot be undone.`
        : `Delete ${gym.name}? This cannot be undone.`;
    Alert.alert('Delete location', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeGym(gym.id) },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {gyms.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No locations yet. Add one, or log a climb to create one automatically.
        </Text>
      ) : (
        gyms.map((gym, i) => (
          <View key={gym.id}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <View style={styles.row}>
              <Text style={[styles.gymName, { color: colors.textPrimary }]} numberOfLines={1}>
                {gym.name}
              </Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => setEditingGym(gym)} hitSlop={8} accessibilityLabel={`Edit ${gym.name}`}>
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => void confirmDelete(gym)} hitSlop={8} accessibilityLabel={`Delete ${gym.name}`}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      <Pressable
        onPress={() => setEditingGym('new')}
        style={[styles.addBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={[styles.addLabel, { color: colors.primary }]}>Add location</Text>
      </Pressable>

      <GymFormModal
        gym={editingGym}
        existing={gyms}
        onSave={handleSave}
        onCancel={() => setEditingGym(null)}
      />
    </View>
  );
}

function GymFormModal({
  gym,
  existing,
  onSave,
  onCancel,
}: {
  gym: Gym | 'new' | null;
  existing: Gym[];
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isOpen = gym !== null;
  const currentId = gym !== null && gym !== 'new' ? gym.id : undefined;

  // Seed the field whenever the target gym changes.
  useEffect(() => {
    setName(gym !== null && gym !== 'new' ? gym.name : '');
    setError(null);
  }, [gym]);

  async function handleSubmit(): Promise<void> {
    const validationError = validateGymName(name, existing, currentId);
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <KeyboardAvoidingView
        style={styles.modalCenter}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
            {gym === 'new' ? 'Add location' : 'Rename location'}
          </Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error !== null) setError(null);
            }}
            placeholder="Movement Englewood"
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSubmit()}
            style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: error !== null ? colors.danger : colors.border, color: colors.textPrimary }]}
          />
          {error !== null && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          <View style={styles.dialogActions}>
            <Pressable onPress={onCancel} style={[styles.dialogBtn, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.dialogBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSubmit()}
              disabled={saving}
              style={[styles.dialogBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={[styles.dialogBtnText, { color: colors.onPrimary }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    paddingVertical: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  gymName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  divider: {
    height: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  dialog: {
    width: '100%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  dialogTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  error: {
    fontSize: FONT_SIZE.sm,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dialogBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  dialogBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
