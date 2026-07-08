import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import type { PlanMode } from '@/constants/plan';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRouteStore } from '@/store/useRouteStore';
import { GradePicker } from '@/components/GradePicker';
import { MediaGalleryField } from '@/components/MediaGalleryField';
import { LocationPickerField } from '@/components/LocationPickerField';
import { NotesEditor, emptyDraft, type NoteDraft } from '@/components/NotesEditor';
import { formatDate } from '@/utils/formatters';
import { startOfDayMs } from '@/utils/dateUtils';
import { validateRouteInput } from '@/utils/validators';
import { addMedia, coverItem } from '@/utils/mediaUtils';
import { confirmAddVideo, pickVideoFromLibrary } from '@/utils/mediaPicker';
import type { MediaItem, RouteInput, RouteNote, RouteWithGym } from '@/types';

interface RouteFormProps {
  /** Existing route to edit; omit for a new climb. */
  initial?: RouteWithGym;
  /** Pre-selected media for a new climb (from the FAB). */
  initialMedia?: MediaItem[];
  submitLabel: string;
  onSubmit: (input: RouteInput) => Promise<void> | void;
  /**
   * Persist the in-progress form without leaving it, returning the saved route.
   * Required to plan a note's move (the note must exist to anchor a plan).
   */
  onPersistDraft?: (input: RouteInput) => Promise<RouteWithGym>;
  onCancel?: () => void;
  /** Append a fresh empty note draft on mount (from the card's "Add note"). */
  startWithNewNote?: boolean;
}

interface FormState {
  name: string;
  gymName: string;
  media: MediaItem[];
  grade: string | null;
  completed: boolean;
  notes: NoteDraft[];
  startedAt: number | null;
  completedAt: number | null;
}

/** Build editor drafts from a route's persisted notes. */
function notesToDrafts(notes: RouteNote[]): NoteDraft[] {
  return notes.map((n) => ({
    id: n.id,
    key: `note-existing-${n.id}`,
    body: n.body ?? '',
    mediaUri: n.media?.uri ?? null,
    mediaType: n.media?.type ?? null,
    hasPlan: n.hasPlan,
  }));
}

function toState(
  initial?: RouteWithGym,
  initialMedia?: MediaItem[],
  startWithNewNote = false,
): FormState {
  const lastLocationName = useSettingsStore.getState().lastLocationName;
  const notes = initial !== undefined ? notesToDrafts(initial.noteEntries) : [];
  return {
    name: initial?.name ?? '',
    gymName: initial?.gym.name ?? (lastLocationName ?? ''),
    media:
      initial !== undefined
        ? initial.media.map((m) => ({ uri: m.uri, type: m.type, width: m.width, height: m.height }))
        : (initialMedia ?? []),
    grade: initial?.grade ?? null,
    completed: initial?.completed ?? false,
    notes: startWithNewNote ? [...notes, emptyDraft()] : notes,
    startedAt: initial?.startedAt ?? null,
    completedAt: initial?.completedAt ?? null,
  };
}

/** A draft worth persisting: has body text or attached media. */
function isMeaningful(n: NoteDraft): boolean {
  return n.body.trim().length > 0 || n.mediaUri !== null;
}

function toInput(s: FormState, { dropEmpty }: { dropEmpty: boolean }): RouteInput {
  const trimmedName = s.name.trim();
  const drafts = dropEmpty ? s.notes.filter(isMeaningful) : s.notes;
  return {
    name: trimmedName.length > 0 ? trimmedName : null,
    gymName: s.gymName,
    media: s.media,
    grade: s.grade,
    completed: s.completed,
    // The legacy single-string column is retired in favor of note entries.
    notes: null,
    noteEntries: drafts.map((n) => ({
      id: n.id,
      body: n.body.trim().length > 0 ? n.body.trim() : null,
      mediaUri: n.mediaUri,
    })),
    startedAt: s.startedAt,
    completedAt: s.completedAt,
  };
}

/** Shared add/edit field set. Validates on submit; both screens reuse this. */
export function RouteForm({
  initial,
  initialMedia,
  submitLabel,
  onSubmit,
  onPersistDraft,
  onCancel,
  startWithNewNote,
}: RouteFormProps): React.JSX.Element {
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const getRoute = useRouteStore((s) => s.getRoute);
  const setLastLocationName = useSettingsStore((s) => s.setLastLocationName);
  const promptSendVideo = useSettingsStore((s) => s.promptSendVideo);
  const [state, setState] = useState<FormState>(() =>
    toState(initial, initialMedia, startWithNewNote),
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateRouteInput>['errors']>({});
  const [saving, setSaving] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'started' | 'completed' | null>(null);
  // The route id once it exists (an edit starts with one; a new climb gets one
  // the first time a note is planned). Drives reloads after the planner closes.
  const savedIdRef = useRef<number | null>(initial?.id ?? null);
  const pendingReload = useRef(false);

  function patch(p: Partial<FormState>): void {
    setState((prev) => ({ ...prev, ...p }));
  }

  /** Rebuild state from a freshly saved route (canonical ids + durable URIs). */
  function syncFromRoute(route: RouteWithGym): void {
    savedIdRef.current = route.id;
    setState((prev) => ({
      ...prev,
      media: route.media.map((m) => ({
        uri: m.uri,
        type: m.type,
        width: m.width,
        height: m.height,
      })),
      notes: notesToDrafts(route.noteEntries),
    }));
  }

  // After the planner screen closes, reload so the note's plan state and any
  // durable photo URI are reflected back in the form.
  useFocusEffect(
    useCallback(() => {
      if (!pendingReload.current || savedIdRef.current === null) return;
      pendingReload.current = false;
      let active = true;
      void getRoute(savedIdRef.current).then((route) => {
        if (active && route !== null) syncFromRoute(route);
      });
      return () => {
        active = false;
      };
    }, [getRoute]),
  );

  async function handleSubmit(): Promise<void> {
    const input = toInput(state, { dropEmpty: true });
    const result = validateRouteInput(input);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      // Save the location as the last used one
      if (state.gymName.length > 0) {
        setLastLocationName(state.gymName);
      }
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  }

  /** Attach freshly picked media to a note, adding it to the gallery too. */
  function attachMediaToNote(key: string, item: MediaItem): void {
    setState((prev) => ({
      ...prev,
      media: addMedia(prev.media, [item]),
      notes: prev.notes.map((n) =>
        n.key === key ? { ...n, mediaUri: item.uri, mediaType: item.type } : n,
      ),
    }));
  }

  /** Persist the form, then open the planner for the given note's media. */
  async function handlePlanNote(key: string, mode: PlanMode): Promise<void> {
    if (onPersistDraft === undefined) return;
    const input = toInput(state, { dropEmpty: false });
    const result = validateRouteInput(input);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const targetIndex = state.notes.findIndex((n) => n.key === key);
    if (targetIndex < 0) return;
    setSaving(true);
    try {
      if (state.gymName.length > 0) setLastLocationName(state.gymName);
      const saved = await onPersistDraft(input);
      syncFromRoute(saved);
      // Notes persist in order, so the target keeps its index. Resolve its id.
      const note = saved.noteEntries[targetIndex];
      if (note === undefined || note.mediaId === null) return;
      pendingReload.current = true;
      router.push({
        pathname: '/plan/[routeId]',
        params: { routeId: String(saved.id), noteId: String(note.id), mode },
      });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Plan a route straight from the main photo: persist the draft, spin up a new
   * photo note anchored to the cover shot, and open the planner on it. The note
   * then shows up in the list where the user can add text to it.
   */
  async function handlePlanRoute(): Promise<void> {
    if (onPersistDraft === undefined) return;
    const cover = coverItem(state.media);
    if (cover === null) {
      Alert.alert(
        'Add a photo first',
        'Routes are planned on a climb photo. Add one under “Photos & videos”, then tap Plan route.',
      );
      return;
    }
    const input = toInput(state, { dropEmpty: false });
    const result = validateRouteInput(input);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // Append a fresh photo note anchored to the cover shot; it carries the plan.
    input.noteEntries = [...(input.noteEntries ?? []), { id: null, body: null, mediaUri: cover.uri }];
    setSaving(true);
    try {
      if (state.gymName.length > 0) setLastLocationName(state.gymName);
      const saved = await onPersistDraft(input);
      syncFromRoute(saved);
      // The plan note is the last one persisted; resolve its id to open it.
      const note = saved.noteEntries[saved.noteEntries.length - 1];
      if (note === undefined || note.mediaId === null) return;
      pendingReload.current = true;
      router.push({
        pathname: '/plan/[routeId]',
        params: { routeId: String(saved.id), noteId: String(note.id) },
      });
    } finally {
      setSaving(false);
    }
  }

  /** Toggling "sent" stamps/clears the send date when it isn't set by hand. */
  function toggleCompleted(value: boolean): void {
    patch({
      completed: value,
      completedAt: value ? (state.completedAt ?? startOfDayMs(Date.now())) : null,
    });
    // Celebrate a send and offer to attach a video straight away.
    if (value && promptSendVideo) {
      confirmAddVideo(() => {
        void pickVideoFromLibrary().then((video) => {
          if (video !== null) {
            setState((prev) => ({ ...prev, media: addMedia(prev.media, [video]) }));
          }
        });
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
      <Field label="Photos & videos">
        <MediaGalleryField value={state.media} onChange={(media) => patch({ media })} />
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

      <Field label="Notes">
        <NotesEditor
          notes={state.notes}
          favorite={coverItem(state.media)}
          onChange={(notes) => patch({ notes })}
          onAttachMedia={attachMediaToNote}
          onPlan={(key, mode) => void handlePlanNote(key, mode)}
        />
      </Field>

        </View>
      </ScrollView>

      {/* Pinned footer: stays above the keyboard so Cancel/Save are always
          reachable, including while editing the multiline notes field. */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {onCancel !== undefined && (
          <Pressable
            onPress={onCancel}
            style={[styles.btn, styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        )}
        {onPersistDraft !== undefined && (
          <Pressable
            onPress={() => void handlePlanRoute()}
            disabled={saving}
            style={[styles.btn, styles.secondaryBtn, styles.planBtn, { borderColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Plan route"
          >
            <Ionicons name="footsteps-outline" size={16} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Plan route</Text>
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
    </KeyboardAvoidingView>
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

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
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
          <Pressable onPress={() => onConfirm(startOfDayMs(tempDate.getTime()))} hitSlop={8}>
            <Text style={[styles.pickerAction, { color: colors.primary, fontWeight: '700' }]}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.dateControlsRow}>
          <Pressable onPress={() => changeDay(-1)} style={[styles.dateBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.selectedDate, { color: colors.textPrimary }]}>
            {isToday(tempDate) ? 'Today' : formatDate(tempDate.getTime())}
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
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
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  planBtn: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  btnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
