import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { RouteGrid } from '@/components/RouteGrid';
import { RouteContextMenu } from '@/components/RouteContextMenu';
import { ColumnDensityControl } from '@/components/ColumnDensityControl';
import type { RouteWithGym } from '@/types';

export default function History(): React.JSX.Element {
  const { colors } = useTheme();
  const routes = useRouteStore((s) => s.routes);
  const loadRoutes = useRouteStore((s) => s.loadRoutes);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithGym | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>();
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadRoutes();
    }, [loadRoutes]),
  );

  const openRoute = (route: RouteWithGym): void => router.push(`/routes/${route.id}`);

  const handleTileLongPress = useCallback((route: RouteWithGym, x: number, y: number): void => {
    setSelectedRoute(route);
    setMenuPosition({ x, y });
    setMenuVisible(true);
  }, []);

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>All Climbs</Text>
      <ColumnDensityControl />
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="time-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing logged yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Climbs you add will show up here, sent and in-progress alike.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <RouteGrid
        routes={routes}
        onTilePress={openRoute}
        onTileLongPress={handleTileLongPress}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
      <RouteContextMenu
        visible={menuVisible}
        route={selectedRoute}
        position={menuPosition}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
