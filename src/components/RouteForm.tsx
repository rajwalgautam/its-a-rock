import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GradePicker } from '@/components/GradePicker';
import { PhotoPickerField, type PhotoValue } from '@/components/PhotoPickerField';
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
        <TextInput
          value={state.gymName}
          onChangeText={(gymName) => patch({ gymName })}
          placeholder="Movement Englewood or Denver, CO"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputColors(colors)]}
        />
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

      <Field label="Status">
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
            {state.completed ? 'Sent' : 'Project'}
          </Text>
          <Switch
            value={state.completed}
            onValueChange={toggleCompleted}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </Field>

      <Field label="Dates" error={errors.dates}>
        <DateField
          label="Started"
          value={state.startedAt}
          onChange={(startedAt) => patch({ startedAt })}
        />
        <DateField
          label="Sent"
          value={state.completedAt}
          onChange={(completedAt) => patch({ completedAt })}
        />
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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.dateRow}>
      <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
        {value !== null ? formatDate(value) : '—'}
      </Text>
      <Pressable onPress={() => onChange(Date.now())} hitSlop={6}>
        <Text style={[styles.dateAction, { color: colors.primary }]}>Today</Text>
      </Pressable>
      {value !== null && (
        <Pressable onPress={() => onChange(null)} hitSlop={6}>
          <Text style={[styles.dateAction, { color: colors.textMuted }]}>Clear</Text>
        </Pressable>
      )}
    </View>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    width: 60,
  },
  dateValue: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  dateAction: {
    fontSize: FONT_SIZE.sm,
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
