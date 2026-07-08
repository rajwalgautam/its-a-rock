import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import type { PlanMode } from '@/constants/plan';
import { useTheme } from '@/theme/ThemeProvider';
import { MediaCaptureMenu } from '@/components/MediaCaptureMenu';
import type { MediaItem } from '@/types';

/** A note while editing the form: a stable key, persisted id, body, and media URI. */
export interface NoteDraft {
  /** Persisted note id, or null for a new unsaved note. */
  id: number | null;
  /** Stable React key. */
  key: string;
  body: string;
  /** URI of the attached gallery media, or null for a text-only note. */
  mediaUri: string | null;
  /** Type of the attached media (for the thumbnail), if any. */
  mediaType: 'photo' | 'video' | null;
  /** Whether a saved plan with moves exists for this note. */
  hasPlan: boolean;
}

interface NotesEditorProps {
  notes: NoteDraft[];
  /** The climb's favorite (cover) photo, offered via "Use Favorite". */
  favorite: MediaItem | null;
  onChange: (notes: NoteDraft[]) => void;
  /** Attach freshly picked media to a note (also added to the gallery). */
  onAttachMedia: (key: string, item: MediaItem) => void;
  /** Persist the form and open the planner for this note's media in the given mode. */
  onPlan: (key: string, mode: PlanMode) => void;
}

let keySeq = 0;
function freshKey(): string {
  return `note-${keySeq++}`;
}

/** Build an empty draft. */
export function emptyDraft(): NoteDraft {
  return { id: null, key: freshKey(), body: '', mediaUri: null, mediaType: null, hasPlan: false };
}

/**
 * The form's notes section: a stack of note cards plus an "Add note" button.
 * Each card has a text field; an empty card offers "Use Favorite" / "Add Media",
 * and once media is attached it shows a thumbnail with a "plan" action.
 */
export function NotesEditor({
  notes,
  favorite,
  onChange,
  onAttachMedia,
  onPlan,
}: NotesEditorProps): React.JSX.Element {
  const { colors } = useTheme();
  const [captureFor, setCaptureFor] = useState<string | null>(null);

  function patch(key: string, p: Partial<NoteDraft>): void {
    onChange(notes.map((n) => (n.key === key ? { ...n, ...p } : n)));
  }

  function addNote(): void {
    onChange([...notes, emptyDraft()]);
  }

  function removeNote(key: string): void {
    onChange(notes.filter((n) => n.key !== key));
  }

  function useFavorite(key: string): void {
    if (favorite === null) return;
    patch(key, { mediaUri: favorite.uri, mediaType: favorite.type });
  }

  return (
    <View style={styles.container}>
      {notes.map((note) => (
        <View key={note.key} style={[styles.card, { borderColor: colors.border }]}>
          {note.mediaUri !== null && (
            <View style={styles.mediaRow}>
              <View style={[styles.thumb, { backgroundColor: colors.tilePlaceholder }]}>
                {note.mediaType === 'photo' ? (
                  <Image source={{ uri: note.mediaUri }} style={styles.thumbImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbImage, styles.centered]}>
                    <Ionicons name="play-circle" size={28} color={colors.onOverlay} />
                  </View>
                )}
              </View>
              {note.mediaType === 'photo' && note.hasPlan && (
                <Pressable
                  onPress={() => onPlan(note.key, 'full')}
                  style={[styles.planBtn, { borderColor: colors.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit plan"
                >
                  <Ionicons name="footsteps-outline" size={18} color={colors.primary} />
                  <Text style={[styles.planText, { color: colors.primary }]}>Edit plan</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => patch(note.key, { mediaUri: null, mediaType: null })}
                hitSlop={8}
                accessibilityLabel="Remove media"
                style={styles.clearMedia}
              >
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {/* A photo without a plan yet: choose how much of the body to plan. */}
          {note.mediaType === 'photo' && !note.hasPlan && (
            <View style={styles.planChoiceRow}>
              <Pressable
                onPress={() => onPlan(note.key, 'hands')}
                style={[styles.planChoiceBtn, { borderColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Plan hands only"
              >
                <View style={styles.handIcons}>
                  <MaterialCommunityIcons name="hand-back-left" size={18} color={colors.primary} />
                  <MaterialCommunityIcons name="hand-back-right" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.planText, { color: colors.primary }]}>Hands Only</Text>
              </Pressable>
              <Pressable
                onPress={() => onPlan(note.key, 'full')}
                style={[styles.planChoiceBtn, { borderColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Plan full route"
              >
                <Ionicons name="map-outline" size={18} color={colors.primary} />
                <Text style={[styles.planText, { color: colors.primary }]}>Full Plan</Text>
              </Pressable>
            </View>
          )}

          <TextInput
            value={note.body}
            onChangeText={(body) => patch(note.key, { body })}
            placeholder="Beta, conditions, how it felt…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
            ]}
          />

          {note.mediaUri === null && (
            <View style={styles.actions}>
              <Pressable
                onPress={() => useFavorite(note.key)}
                disabled={favorite === null}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.surfaceAlt, opacity: favorite === null ? 0.4 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Use favorite photo"
              >
                <Ionicons name="star" size={16} color={colors.textSecondary} />
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Use Favorite</Text>
              </Pressable>
              <Pressable
                onPress={() => setCaptureFor(note.key)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Add media"
              >
                <Ionicons name="camera" size={16} color={colors.onPrimary} />
                <Text style={[styles.actionLabel, { color: colors.onPrimary }]}>Add Media</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => removeNote(note.key)}
            hitSlop={6}
            accessibilityLabel="Delete note"
            style={styles.removeNote}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={addNote}
        style={[styles.addBtn, { borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel="Add note"
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={[styles.addText, { color: colors.primary }]}>Add Note</Text>
      </Pressable>

      <MediaCaptureMenu
        visible={captureFor !== null}
        onPick={(item) => {
          if (captureFor !== null) onAttachMedia(captureFor, item);
        }}
        onClose={() => setCaptureFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  planText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  planChoiceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  planChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  handIcons: {
    flexDirection: 'row',
  },
  clearMedia: {
    marginLeft: 'auto',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  multiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  removeNote: {
    alignSelf: 'flex-end',
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
  },
  addText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
