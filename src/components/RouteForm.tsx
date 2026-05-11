import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DEFAULT_ROUTE_GRADE, ROUTE_GRADES } from '@/constants/grades';
import { ATTEMPTS_MAX, NOTES_MAX_LENGTH, ROUTE_NAME_MAX_LENGTH } from '@/constants/limits';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { Gym, PhotoRef, RouteInput, RouteTagId, RouteWithRelations } from '@/types';
import { dateStringToDate, toDateString } from '@/utils/dateUtils';
import { validateRouteInput } from '@/utils/validators';
import { GymInput } from './GymInput';
import { PhotoPickerField } from './PhotoPickerField';
import { TagSelector } from './TagSelector';

interface Props {
  gyms: Gym[];
  initialRoute?: RouteWithRelations | null;
  submitLabel: string;
  onSubmit: (input: RouteInput) => Promise<void>;
}

export function RouteForm({ gyms, initialRoute, submitLabel, onSubmit }: Props): React.JSX.Element {
  const [name, setName] = useState(initialRoute?.name ?? '');
  const [gymName, setGymName] = useState(initialRoute?.gym.name ?? '');
  const [photo, setPhoto] = useState<PhotoRef | null>(initialRoute ? {
    assetId: initialRoute.photoAssetId,
    uri: initialRoute.photoUri,
    width: initialRoute.photoWidth,
    height: initialRoute.photoHeight,
  } : null);
  const [grade, setGrade] = useState(initialRoute?.grade ?? DEFAULT_ROUTE_GRADE);
  const [attempts, setAttempts] = useState(initialRoute?.attempts ?? 0);
  const [completed, setCompleted] = useState(initialRoute?.completed ?? false);
  const [notes, setNotes] = useState(initialRoute?.notes ?? '');
  const [tagIds, setTagIds] = useState<RouteTagId[]>(initialRoute?.tags ?? []);
  const [dateText, setDateText] = useState(toDateString(initialRoute?.climbedAt ?? Date.now()));
  const [saving, setSaving] = useState(false);

  const input = useMemo<RouteInput>(() => ({
    name,
    gymName,
    photo,
    grade,
    attempts,
    completed,
    notes,
    tagIds,
    climbedAt: dateStringToDate(dateText).getTime(),
  }), [attempts, completed, dateText, grade, gymName, name, notes, photo, tagIds]);

  const validation = validateRouteInput(input);

  function toggleTag(tagId: RouteTagId): void {
    setTagIds((current) => (
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    ));
  }

  async function handleSubmit(): Promise<void> {
    const currentValidation = validateRouteInput(input);
    if (!currentValidation.valid) {
      Alert.alert('Check the route', Object.values(currentValidation.errors)[0]);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(input);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Route name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Blue cave problem"
          placeholderTextColor={COLORS.textMuted}
          maxLength={ROUTE_NAME_MAX_LENGTH}
          style={styles.input}
        />
      </View>

      <GymInput value={gymName} gyms={gyms} onChange={setGymName} />
      <PhotoPickerField photo={photo} onChange={setPhoto} />

      <View style={styles.field}>
        <Text style={styles.label}>Grade</Text>
        <View style={styles.gradeGrid}>
          {ROUTE_GRADES.map((routeGrade) => {
            const selected = routeGrade === grade;
            return (
              <TouchableOpacity
                key={routeGrade}
                style={[styles.gradeChip, selected && styles.gradeChipOn]}
                onPress={() => setGrade(routeGrade)}
              >
                <Text style={[styles.gradeText, selected && styles.gradeTextOn]}>{routeGrade}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.rowCard}>
        <View>
          <Text style={styles.label}>Attempts</Text>
          <Text style={styles.help}>Default is 0. Adjust when useful.</Text>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepButton} onPress={() => setAttempts(Math.max(0, attempts - 1))}>
            <Text style={styles.stepText}>-</Text>
          </TouchableOpacity>
          <TextInput
            value={String(attempts)}
            onChangeText={(value) => {
              const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
              setAttempts(Number.isNaN(parsed) ? 0 : Math.min(ATTEMPTS_MAX, parsed));
            }}
            keyboardType="number-pad"
            style={styles.attemptInput}
          />
          <TouchableOpacity style={styles.stepButton} onPress={() => setAttempts(Math.min(ATTEMPTS_MAX, attempts + 1))}>
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.completed, completed && styles.completedOn]} onPress={() => setCompleted(!completed)}>
        <Text style={[styles.completedText, completed && styles.completedTextOn]}>
          {completed ? 'Completed' : 'Not completed yet'}
        </Text>
      </TouchableOpacity>

      <TagSelector selectedTagIds={tagIds} onToggle={toggleTag} />

      <View style={styles.field}>
        <Text style={styles.label}>Climbed date</Text>
        <TextInput
          value={dateText}
          onChangeText={setDateText}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.counter}>{notes.length}/{NOTES_MAX_LENGTH}</Text>
        </View>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Beta, crux, foot sequence..."
          placeholderTextColor={COLORS.textMuted}
          maxLength={NOTES_MAX_LENGTH}
          multiline
          style={[styles.input, styles.notes]}
        />
      </View>

      {!validation.valid && <Text style={styles.error}>{Object.values(validation.errors)[0]}</Text>}

      <TouchableOpacity style={[styles.submit, saving && styles.submitDisabled]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    gap: SPACING.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  field: {
    gap: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  help: {
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
  },
  notes: {
    minHeight: 110,
    paddingTop: SPACING.md,
    textAlignVertical: 'top',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gradeChip: {
    minWidth: 52,
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chip,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  gradeChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gradeText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  gradeTextOn: {
    color: COLORS.surface,
  },
  counter: {
    color: COLORS.textMuted,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  stepText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  attemptInput: {
    width: 54,
    minHeight: 42,
    textAlign: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  completed: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  completedOn: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  completedText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  completedTextOn: {
    color: COLORS.surface,
  },
  error: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  submit: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: FONT_SIZE.md,
  },
});
