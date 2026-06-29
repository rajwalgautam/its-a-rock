import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { RouteNote } from '@/types';

interface NotesSectionProps {
  notes: RouteNote[];
  /** Open a note's attached media / plan (optional). */
  onPressNote?: (note: RouteNote) => void;
}

/** Read-only notes display on the detail card, switchable between rows and grid. */
export function NotesSection({ notes, onPressNote }: NotesSectionProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const layout = useSettingsStore((s) => s.notesLayout);
  const setLayout = useSettingsStore((s) => s.setNotesLayout);

  if (notes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMuted }]}>Notes</Text>
        <View style={[styles.toggle, { borderColor: colors.border }]}>
          <LayoutButton
            icon="list"
            label="Rows"
            active={layout === 'rows'}
            onPress={() => setLayout('rows')}
          />
          <LayoutButton
            icon="grid"
            label="Grid"
            active={layout === 'grid'}
            onPress={() => setLayout('grid')}
          />
        </View>
      </View>

      {layout === 'rows' ? (
        <View style={styles.rows}>
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} onPress={onPressNote} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {notes.map((note) => (
            <NoteTile key={note.id} note={note} onPress={onPressNote} />
          ))}
        </View>
      )}
    </View>
  );
}

function LayoutButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} layout`}
      style={[styles.toggleBtn, active && { backgroundColor: colors.surfaceAlt }]}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textMuted} />
    </Pressable>
  );
}

/** Thumbnail with a placeholder fallback and a plan/video marker. */
function Thumb({ note, size }: { note: RouteNote; size: number }): React.JSX.Element {
  const { colors } = useTheme();
  const media = note.media;
  const dims = { width: size, height: size };
  return (
    <View style={[styles.thumb, dims, { backgroundColor: colors.tilePlaceholder }]}>
      {media !== null && media.type === 'photo' ? (
        <Image source={{ uri: media.uri }} style={styles.thumbImage} resizeMode="cover" />
      ) : media !== null && media.type === 'video' ? (
        <View style={[styles.thumbImage, styles.centered]}>
          <Ionicons name="play-circle" size={size * 0.4} color={colors.onOverlay} />
        </View>
      ) : (
        <View style={[styles.thumbImage, styles.centered]}>
          <Ionicons name="document-text-outline" size={size * 0.38} color={colors.textMuted} />
        </View>
      )}
      {note.hasPlan && (
        <View style={[styles.planBadge, { backgroundColor: colors.overlay }]}>
          <Ionicons name="footsteps-outline" size={12} color={colors.onOverlay} />
        </View>
      )}
    </View>
  );
}

function NoteRow({
  note,
  onPress,
}: {
  note: RouteNote;
  onPress?: (note: RouteNote) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const body = note.body ?? '';
  return (
    <Pressable
      onPress={onPress !== undefined ? () => onPress(note) : undefined}
      style={[styles.row, { borderColor: colors.border }]}
    >
      <Thumb note={note} size={64} />
      <Text
        style={[styles.rowText, { color: body.length > 0 ? colors.textPrimary : colors.textMuted }]}
        numberOfLines={3}
      >
        {body.length > 0 ? body : 'No text'}
      </Text>
    </Pressable>
  );
}

function NoteTile({
  note,
  onPress,
}: {
  note: RouteNote;
  onPress?: (note: RouteNote) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const body = note.body ?? '';
  return (
    <Pressable
      onPress={onPress !== undefined ? () => onPress(note) : undefined}
      style={[styles.tile, { borderColor: colors.border }]}
    >
      <Thumb note={note} size={TILE_SIZE} />
      {body.length > 0 && (
        <View style={[styles.tileOverlay, { backgroundColor: colors.overlay }]}>
          <Text style={[styles.tileText, { color: colors.onOverlay }]} numberOfLines={2}>
            {body}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const TILE_SIZE = 150;

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  rows: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  rowText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  tileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TILE_SIZE / 2,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  },
  tileText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  thumb: {
    borderRadius: RADIUS.md,
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
  planBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
