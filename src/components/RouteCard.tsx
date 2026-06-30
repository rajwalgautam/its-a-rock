import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RouteForm } from '@/components/RouteForm';
import { MediaViewer } from '@/components/MediaViewer';
import { NotesSection } from '@/components/NotesSection';
import { useRouteStore } from '@/store/useRouteStore';
import { formatDate, formatGradeLabel, statusLabel } from '@/utils/formatters';
import type { RouteInput, RouteNote, RouteWithGym } from '@/types';

interface RouteCardProps {
  route: RouteWithGym;
  /** Called with the updated route after a successful save. */
  onSaved?: (route: RouteWithGym) => void;
}

/** Reusable detail card that flips between view and edit; edits persist to SQLite. */
export function RouteCard({ route, onSaved }: RouteCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const router = useRouter();
  const editRoute = useRouteStore((s) => s.editRoute);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(route);
  const [viewerOpen, setViewerOpen] = useState(false);

  /** Open a note's plan in the full planner, scoped to that note's media. */
  function openNotePlan(note: RouteNote): void {
    router.push({
      pathname: '/plan/[routeId]',
      params: { routeId: String(current.id), noteId: String(note.id) },
    });
  }

  async function handleSave(input: RouteInput): Promise<void> {
    const updated = await editRoute(current.id, input);
    setCurrent(updated);
    setEditing(false);
    onSaved?.(updated);
  }

  /** Persist edits without leaving the form (used to anchor a note's plan). */
  async function persistDraft(input: RouteInput): Promise<RouteWithGym> {
    const updated = await editRoute(current.id, input);
    setCurrent(updated);
    onSaved?.(updated);
    return updated;
  }

  if (editing) {
    // RouteForm owns its own scroll + pinned footer, so it fills the screen.
    return (
      <RouteForm
        initial={current}
        submitLabel="Save"
        onSubmit={handleSave}
        onPersistDraft={persistDraft}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const media = current.media;
  const hasMedia = media.length > 0;
  const coverUri = current.photoUri;
  const videoCount = media.filter((m) => m.type === 'video').length;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {hasMedia && (
        <>
          <Pressable
            onPress={() => setViewerOpen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel="View media full screen"
          >
            {coverUri !== null && coverUri.length > 0 ? (
              <Image source={{ uri: coverUri }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.videoCover, { backgroundColor: colors.tilePlaceholder }]}>
                <Ionicons name="play-circle" size={56} color={colors.onOverlay} />
              </View>
            )}
            {(media.length > 1 || videoCount > 0) && (
              <View style={[styles.mediaBadge, { backgroundColor: colors.overlay }]}>
                {videoCount > 0 && <Ionicons name="videocam" size={14} color={colors.onOverlay} />}
                <Text style={[styles.mediaBadgeText, { color: colors.onOverlay }]}>
                  {media.length}
                </Text>
              </View>
            )}
          </Pressable>
          <MediaViewer
            media={media.map((m) => ({ uri: m.uri, type: m.type }))}
            visible={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        </>
      )}

      <View style={styles.headerRow}>
        <Text style={[styles.grade, { color: colors.textPrimary }]}>
          {formatGradeLabel(current.grade)}
        </Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: current.completed ? colors.primary : colors.success },
          ]}
        >
          <Text style={styles.statusText}>{statusLabel(current.completed)}</Text>
        </View>
      </View>

      {current.name !== null && current.name.length > 0 && (
        <Text style={[styles.name, { color: colors.textSecondary }]}>{current.name}</Text>
      )}

      <DetailRow icon="location-outline" value={current.gym.name} />
      {current.startedAt !== null && (
        <DetailRow icon="play-outline" label="Started" value={formatDate(current.startedAt)} />
      )}
      {current.completedAt !== null && (
        <DetailRow icon="flag-outline" label="Sent" value={formatDate(current.completedAt)} />
      )}
      <Pressable
        onPress={() => setEditing(true)}
        style={[styles.editBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="create-outline" size={18} color={colors.primary} />
        <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
      </Pressable>

      <NotesSection notes={current.noteEntries} onPressNote={openNotePlan} />
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  value: string;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      {label !== undefined && (
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      )}
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: RADIUS.lg,
  },
  videoCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  mediaBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grade: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    width: 52,
  },
  detailValue: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  editText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
