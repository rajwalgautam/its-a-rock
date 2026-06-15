import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { RouteGrid } from '@/components/RouteGrid';
import { RouteContextMenu, type MenuAnchor } from '@/components/RouteContextMenu';
import { HistoryFilterBar } from '@/components/HistoryFilterBar';
import { ColumnDensityControl } from '@/components/ColumnDensityControl';
import { applyHistoryFilters, DEFAULT_HISTORY_FILTERS, hasActiveFilters } from '@/utils/historyFilters';
import type { HistoryFilters, RouteWithGym } from '@/types';

export default function History(): React.JSX.Element {
  const { colors } = useTheme();
  const routes = useRouteStore((s) => s.routes);
  const gyms = useRouteStore((s) => s.gyms);
  const loadRoutes = useRouteStore((s) => s.loadRoutes);
  const loadGyms = useRouteStore((s) => s.loadGyms);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithGym | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | undefined>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);

  useFocusEffect(
    useCallback(() => {
      void loadRoutes();
      void loadGyms();
    }, [loadRoutes, loadGyms]),
  );

  const visibleRoutes = useMemo(() => applyHistoryFilters(routes, filters), [routes, filters]);

  const openRoute = (route: RouteWithGym): void => router.push(`/routes/${route.id}`);

  const handleTileLongPress = useCallback((route: RouteWithGym, anchor: MenuAnchor): void => {
    setSelectedRoute(route);
    setMenuAnchor(anchor);
    setMenuVisible(true);
  }, []);

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>All Climbs</Text>
        <ColumnDensityControl />
      </View>
      <HistoryFilterBar filters={filters} gyms={gyms} onChange={setFilters} />
    </View>
  );

  const filtered = hasActiveFilters(filters) && routes.length > 0;
  const empty = (
    <View style={styles.empty}>
      <Ionicons name={filtered ? 'funnel-outline' : 'time-outline'} size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {filtered ? 'No climbs match' : 'Nothing logged yet'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filtered
          ? 'Try loosening or clearing your filters.'
          : 'Climbs you add will show up here, sent and in-progress alike.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <RouteGrid
        routes={visibleRoutes}
        onTilePress={openRoute}
        onTileLongPress={handleTileLongPress}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
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
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
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
