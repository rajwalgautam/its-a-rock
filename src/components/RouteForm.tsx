import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GradePicker } from '@/components/GradePicker';
import { PhotoPickerField, type PhotoValue } from '@/components/PhotoPickerField';
import { LocationPickerField } from '@/components/LocationPickerField';
import { formatDate } from '@/utils/formatters';
import { validateRouteInput } from '@/utils/validators';
import type { RouteInput, RouteWithGym } from '@/types';

interface RouteFormProps {
  /** Existing route to edit; omit for a new climb. */
  initial?: RouteWithGym;
  submitLabel: string;
  onSubmit: (input: RouteInput) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  name: string;
  gymName: string;
  photo: PhotoValue | null;
  grade: string | null;
  completed: boolean;
  notes: string;
  startedAt: number | null;
  completedAt: number | null;
}

function toState(initial?: RouteWithGym): FormState {
  return {
    name: initial?.name ?? '',
    gymName: initial?.gym.name ?? '',
    photo:
      initial?.photoUri != null
        ? { uri: initial.photoUri, width: initial.photoWidth, height: initial.photoHeight }
        : null,
    grade: initial?.grade ?? null,
    completed: initial?.completed ?? false,
    notes: initial?.notes ?? '',
    startedAt: initial?.startedAt ?? null,
    completedAt: initial?.completedAt ?? null,
  };
}

function toInput(s: FormState): RouteInput {
  const trimmedName = s.name.trim();
  const trimmedNotes = s.notes.trim();
  return {
    name: trimmedName.length > 0 ? trimmedName : null,
    gymName: s.gymName,
    photoUri: s.photo?.uri ?? null,
    photoWidth: s.photo?.width ?? null,
    photoHeight: s.photo?.height ?? null,
    grade: s.grade,
    completed: s.completed,
    notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
  };
}

/** Shared add/edit field set. Validates on submit; both screens reuse this. */
export function RouteForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: RouteFormProps): React.JSX.Element {
  const { colors } = useTheme();
  const [state, setState] = useState<FormState>(() => toState(initial));
  const [errors, setErrors] = useState<ReturnType<typeof validateRouteInput>['errors']>({});
  const [saving, setSaving] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'started' | 'completed' | null>(null);

  function patch(p: Partial<FormState>): void {
    setState((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(): Promise<void> {
    const input = toInput(state);
    const result = validateRouteInput(input);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  }

  /** Toggling "sent" stamps/clears the send date when it isn't set by hand. */
  function toggleCompleted(value: boolean): void {
    patch({
      completed: value,
      completedAt: value ? (state.completedAt ?? Date.now()) : null,
    });
  }

  return (
    <View style={styles.form}>
      <Field label="Photo">
        <PhotoPickerField value={state.photo} onChange={(photo) => patch({ photo })} />
      </Field>

      <Field label="Gym / location" required error={errors.gymName}>
        <LocationPickerField value={state.gymName} onChange={(gymName) => patch({ gymName })} />
      </Field>

      <Field label="Name (optional)">
        <TextInput
          value={state.name}
          onChangeText={(name) => patch({ name })}
          placeholder="The slabby arête"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputColors(colors)]}
        />
      </Field>

      <Field label="Grade" error={errors.grade}>
        <GradePicker value={state.grade} onChange={(grade) => patch({ grade })} />
      </Field>

      <Field label="">
        <Pressable
          onPress={() => toggleCompleted(!state.completed)}
          style={styles.checkboxRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: state.completed }}
        >
          <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: state.completed ? colors.primary : 'transparent' }]}>
            {state.completed && (
              <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
            )}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
            Completed
          </Text>
        </Pressable>
      </Field>

      <Field label="Dates" error={errors.dates}>
        <DatePickerButton
          label="Started"
          value={state.startedAt}
          onPress={() => setDatePickerField('started')}
        />
        {state.completed && (
          <DatePickerButton
            label="Completed"
            value={state.completedAt}
            onPress={() => setDatePickerField('completed')}
          />
        )}
      </Field>

      <Field label="Notes (optional)">
        <TextInput
          value={state.notes}
          onChangeText={(notes) => patch({ notes })}
          placeholder="Beta, conditions, how it felt…"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, styles.multiline, inputColors(colors)]}
        />
      </Field>

      <View style={styles.actions}>
        {onCancel !== undefined && (
          <Pressable
            onPress={onCancel}
            style={[styles.btn, styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={saving}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={[styles.btnText, { color: colors.onPrimary }]}>
            {saving ? 'Saving…' : submitLabel}
          </Text>
        </Pressable>
      </View>

      <DatePickerModal
        isVisible={datePickerField !== null}
        value={datePickerField === 'started' ? state.startedAt : state.completedAt}
        onConfirm={(date) => {
          if (datePickerField === 'started') {
            patch({ startedAt: date });
          } else if (datePickerField === 'completed') {
            patch({ completedAt: date });
          }
          setDatePickerField(null);
        }}
        onCancel={() => setDatePickerField(null)}
      />
    </View>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {children}
      {error !== undefined && (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
}

function DatePickerButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number | null;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.dateButtonContent}>
        <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.dateButtonValue, { color: colors.textPrimary }]}>
          {value !== null ? formatDate(value) : '—'}
        </Text>
      </View>
      <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

function DatePickerModal({
  isVisible,
  value,
  onConfirm,
  onCancel,
}: {
  isVisible: boolean;
  value: number | null;
  onConfirm: (date: number) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const [tempDate, setTempDate] = useState(new Date(value ?? Date.now()));

  function changeDay(delta: number): void {
    const newDate = new Date(tempDate);
    newDate.setDate(newDate.getDate() + delta);
    if (newDate <= new Date()) {
      setTempDate(newDate);
    }
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={onCancel} />
      <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[styles.pickerAction, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Select date</Text>
          <Pressable onPress={() => onConfirm(tempDate.getTime())} hitSlop={8}>
            <Text style={[styles.pickerAction, { color: colors.primary, fontWeight: '700' }]}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.dateControlsRow}>
          <Pressable onPress={() => changeDay(-1)} style={[styles.dateBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.selectedDate, { color: colors.textPrimary }]}>
            {formatDate(tempDate.getTime())}
          </Text>
          <Pressable onPress={() => changeDay(1)} style={[styles.dateBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Pressable onPress={() => setTempDate(new Date())} style={[styles.todayBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.todayBtnText, { color: colors.onPrimary }]}>Today</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function inputColors(colors: ReturnType<typeof useTheme>['colors']) {
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.textPrimary,
  };
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.lg,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  error: {
    fontSize: FONT_SIZE.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateButtonContent: {
    flex: 1,
  },
  dateButtonLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  dateButtonValue: {
    fontSize: FONT_SIZE.md,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  pickerAction: {
    fontSize: FONT_SIZE.md,
  },
  dateControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  dateBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDate: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    minWidth: 120,
    textAlign: 'center',
  },
  todayBtn: {
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  secondaryBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
