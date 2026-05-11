import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { DailyRouteStats } from '@/types';
import { getCalendarDays } from '@/utils/dateUtils';

interface Props {
  year: number;
  month: number;
  selectedDate: string | null;
  statsByDate: Record<string, DailyRouteStats>;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarGrid({ year, month, selectedDate, statsByDate, onSelectDate }: Props): React.JSX.Element {
  const days = getCalendarDays(year, month);

  return (
    <View style={styles.container}>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const stats = statsByDate[day.date];
          const hasActivity = stats?.totalRoutes > 0;
          const hasSend = stats?.completedRoutes > 0;
          const selected = selectedDate === day.date;
          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.day,
                !day.isCurrentMonth && styles.dayMuted,
                day.isFuture && styles.dayFuture,
                hasActivity && (hasSend ? styles.daySent : styles.dayProject),
                day.isToday && styles.dayToday,
                selected && styles.daySelected,
              ]}
              onPress={() => onSelectDate(day.date)}
              disabled={day.isFuture}
            >
              <Text style={[styles.dayText, (hasActivity || selected) && styles.dayTextStrong]}>
                {day.dayOfMonth}
              </Text>
              {hasActivity && <Text style={styles.count}>{stats.completedRoutes}/{stats.totalRoutes}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  day: {
    width: `${100 / 7 - 1}%`,
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayMuted: {
    opacity: 0.45,
  },
  dayFuture: {
    backgroundColor: COLORS.future,
    opacity: 0.45,
  },
  daySent: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dayProject: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },
  daySelected: {
    borderWidth: 3,
    borderColor: COLORS.primaryDark,
  },
  dayText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  dayTextStrong: {
    color: COLORS.surface,
  },
  count: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
  },
});
