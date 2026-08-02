import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PlanTile } from '@/components/PlanTile';
import { groupPlansByRoute } from '@/utils/planGrouping';
import type { PlanSummary, PlansLayout } from '@/types';

const GAP = SPACING.sm;
const EDGE = SPACING.lg;

const LAYOUTS: { value: PlansLayout; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { value: 'individual', icon: 'albums-outline', label: 'Individual plans' },
  { value: 'stacked', icon: 'layers-outline', label: 'Stacked by climb' },
];

export default function Plans(): React.JSX.Element {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const plans = useRouteStore((s) => s.plans);
  const loadPlans = useRouteStore((s) => s.loadPlans);
  const columns = useSettingsStore((s) => s.columnDensity);
  const layout = useSettingsStore((s) => s.plansLayout);
  const setLayout = useSettingsStore((s) => s.setPlansLayout);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans]),
  );

  const tileSize = Math.floor((width - EDGE * 2 - GAP * (columns - 1)) / columns);

  /** Open a single plan in the planner, scoped to its note when it has one. */
  const openPlan = useCallback((plan: PlanSummary): void => {
    router.push({
      pathname: '/plan/[routeId]',
      params:
        plan.noteId !== null
          ? { routeId: String(plan.routeId), noteId: String(plan.noteId) }
          : { routeId: String(plan.routeId) },
    });
  }, []);

  const stacks = groupPlansByRoute(plans);

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Plans</Text>
      <View style={[styles.toggle, { backgroundColor: colors.surfaceAlt }]}>
        {LAYOUTS.map(({ value, icon, label }) => {
          const active = value === layout;
          return (
            <Pressable
              key={value}
              onPress={() => setLayout(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              style={[styles.toggleBtn, active && { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name={icon}
                size={18}
                color={active ? colors.onPrimary : colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="footsteps-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No plans yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Draw a move plan on a climb&apos;s photo note and it&apos;ll show up here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      {layout === 'stacked' ? (
        <FlatList
          key={`stacked-${columns}`}
          data={stacks}
          keyExtractor={(item) => `route-${item.route.id}`}
          numColumns={columns}
          renderItem={({ item }) => (
            <PlanTile
              summary={item.plans[0]!}
              size={tileSize}
              stackCount={item.plans.length}
              // A lone plan opens directly; a real stack opens the climb, where
              // all its plans live.
              onPress={(plan) =>
                item.plans.length > 1 ? router.push(`/routes/${item.route.id}`) : openPlan(plan)
              }
            />
          )}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key={`individual-${columns}`}
          data={plans}
          keyExtractor={(item) => `plan-${item.planId}`}
          numColumns={columns}
          renderItem={({ item }) => <PlanTile summary={item} size={tileSize} onPress={openPlan} />}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: EDGE,
    gap: GAP,
    flexGrow: 1,
  },
  columnWrapper: {
    gap: GAP,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
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
