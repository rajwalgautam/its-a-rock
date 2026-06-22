import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Markdown } from '@/components/Markdown';
import {
  fetchChangelog,
  fetchRecentReleases,
  releasesUrl,
  type ReleaseSummary,
} from '@/utils/updateChecker';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; releases: ReleaseSummary[] };

export default function Releases(): React.JSX.Element {
  const { colors } = useTheme();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const releases = await fetchRecentReleases(10);
        if (!cancelled) setState({ status: 'ready', releases });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {state.status === 'loading' && (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      )}

      {state.status === 'error' && (
        <View style={styles.center}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Couldn&apos;t load release notes. Check your connection and try again.
          </Text>
        </View>
      )}

      {state.status === 'ready' &&
        (state.releases.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              No releases found.
            </Text>
          </View>
        ) : (
          state.releases.map((release) => <ReleaseRow key={release.tag} release={release} />)
        ))}

      <Pressable
        onPress={() => void Linking.openURL(releasesUrl)}
        style={[styles.linkRow, { borderColor: colors.border }]}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>
          View all releases on GitHub
        </Text>
        <Ionicons name="open-outline" size={18} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

function ReleaseRow({ release }: { release: ReleaseSummary }): React.JSX.Element {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle(): Promise<void> {
    const next = !expanded;
    setExpanded(next);
    if (next && notes === null && !loading) {
      setLoading(true);
      const fetched = await fetchChangelog(release.tag);
      setNotes(fetched ?? '');
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
      <Pressable style={styles.cardHeader} onPress={() => void toggle()}>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.version, { color: colors.textPrimary }]}>
            {release.name || release.tag}
          </Text>
          {release.publishedAt.length > 0 && (
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatReleaseDate(release.publishedAt)}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : notes !== null && notes.length > 0 ? (
            <Markdown source={notes} />
          ) : (
            <Text style={[styles.message, { color: colors.textMuted }]}>
              Notes aren&apos;t available for this release.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function formatReleaseDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  message: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  version: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  date: {
    fontSize: FONT_SIZE.sm,
  },
  cardBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  linkText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
