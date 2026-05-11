import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
}

export function StatCard({ label, value }: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: COLORS.text,
  },
  label: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
});
