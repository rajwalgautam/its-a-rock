import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { useRouteActions } from '@/hooks/useRouteActions';
import { RouteGrid } from '@/components/RouteGrid';
import { ColumnDensityControl } from '@/components/ColumnDensityControl';
import type { RouteWithGym } from '@/types';

export default function History(): React.JSX.Element {
  const { colors } = useTheme();
  const routes = useRouteStore((s) => s.routes);
  const loadRoutes = useRouteStore((s) => s.loadRoutes);
  const onLongPress = useRouteActions();

  useFocusEffect(
    useCallback(() => {
      void loadRoutes();
    }, [loadRoutes]),
  );

  const openRoute = (route: RouteWithGym): void => router.push(`/routes/${route.id}`);

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
        onTileLongPress={onLongPress}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
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
