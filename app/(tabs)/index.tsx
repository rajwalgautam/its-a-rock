import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { RouteGrid } from '@/components/RouteGrid';
import { StatCard } from '@/components/StatCard';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { UpdateBanner } from '@/components/UpdateBanner';
import { RouteContextMenu, type MenuAnchor } from '@/components/RouteContextMenu';
import type { RouteWithGym } from '@/types';

export default function MyClimbing(): React.JSX.Element {
  const { colors } = useTheme();
  const projects = useRouteStore((s) => s.projects);
  const stats = useRouteStore((s) => s.weeklyStats);
  const loadProjects = useRouteStore((s) => s.loadProjects);
  const loadWeeklyStats = useRouteStore((s) => s.loadWeeklyStats);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithGym | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | undefined>();
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
      void loadWeeklyStats();
    }, [loadProjects, loadWeeklyStats]),
  );

  const openRoute = (route: RouteWithGym): void => router.push(`/routes/${route.id}`);

  const handleTileLongPress = useCallback((route: RouteWithGym, anchor: MenuAnchor): void => {
    setSelectedRoute(route);
    setMenuAnchor(anchor);
    setMenuVisible(true);
  }, []);

  const header = (
    <View style={styles.header}>
      <UpdateBanner />
      <Text style={[styles.title, { color: colors.textPrimary }]}>This week</Text>
      <View style={styles.statsRow}>
        <StatCard label="Visits" value={String(stats?.visits ?? 0)} />
        <StatCard label="Sends" value={String(stats?.completedThisWeek ?? 0)} accentColor={colors.success} />
        <StatCard label="Projects" value={String(stats?.activeProjects ?? 0)} />
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Active projects</Text>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="barbell-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No active projects</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Tap the + button to log a climb you&apos;re working on.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <RouteGrid
        routes={projects}
        onTilePress={openRoute}
        onTileLongPress={handleTileLongPress}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
      <FloatingAddButton onPress={(seed) => {
        if (seed) {
          router.push({ pathname: '/routes/new', params: { uri: seed.uri, type: seed.type } });
        } else {
          router.push('/routes/new');
        }
      }} />
      <RouteContextMenu
        visible={menuVisible}
        route={selectedRoute}
        anchor={menuAnchor}
        onDismiss={() => setMenuVisible(false)}
        onEdit={(route) => router.push(`/routes/${route.id}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
