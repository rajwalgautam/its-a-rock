import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalendarGrid } from '@/components/CalendarGrid';
import { RouteCard } from '@/components/RouteCard';
import { StatCard } from '@/components/StatCard';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useRouteStore } from '@/store/useRouteStore';
import { formatFullDate, formatMonthYear, todayDateString, toDateString } from '@/utils/dateUtils';
import { formatAttempts, formatPercent } from '@/utils/formatters';
import { buildSummaryStats } from '@/utils/routeStats';

export default function StatsScreen(): React.JSX.Element {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayDateString());
  const { monthRoutes, monthStats, loadMonth } = useRouteStore();

  useEffect(() => {
    void loadMonth(year, month);
  }, [loadMonth, month, year]);

  const monthSummary = useMemo(() => buildSummaryStats(monthRoutes), [monthRoutes]);
  const selectedRoutes = useMemo(
    () => monthRoutes.filter((route) => selectedDate !== null && toDateString(route.climbedAt) === selectedDate),
    [monthRoutes, selectedDate],
  );
  const selectedStats = selectedDate === null ? undefined : monthStats[selectedDate];

  function shiftMonth(delta: number): void {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDate(null);
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.eyebrow}>Stats</Text>
          <Text style={styles.title}>Climbing history</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Routes this month" value={String(monthSummary.totalRoutes)} />
          <StatCard label="Completed" value={String(monthSummary.completedRoutes)} />
          <StatCard label="Completion rate" value={formatPercent(monthSummary.completionRate)} />
          <StatCard label="Attempts" value={String(monthSummary.totalAttempts)} />
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => shiftMonth(-1)}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthYear(year, month)}</Text>
            <TouchableOpacity style={styles.navButton} onPress={() => shiftMonth(1)} disabled={isCurrentMonth}>
              <Text style={[styles.navText, isCurrentMonth && styles.navDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
          <CalendarGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            statsByDate={monthStats}
            onSelectDate={setSelectedDate}
          />
        </View>

        {selectedDate && (
          <View style={styles.dayPanel}>
            <Text style={styles.dayTitle}>{formatFullDate(selectedDate)}</Text>
            {selectedStats ? (
              <Text style={styles.dayMeta}>
                {selectedStats.completedRoutes}/{selectedStats.totalRoutes} completed · {formatAttempts(selectedStats.totalAttempts)}
              </Text>
            ) : (
              <Text style={styles.dayMeta}>No routes logged.</Text>
            )}
            <View style={styles.dayRoutes}>
              {selectedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} onPress={() => router.push(`/routes/${route.id}`)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  eyebrow: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  calendarCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: '700',
  },
  navDisabled: {
    color: COLORS.border,
  },
  monthTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  dayPanel: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  dayTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  dayMeta: {
    color: COLORS.textMuted,
  },
  dayRoutes: {
    gap: SPACING.md,
  },
});
