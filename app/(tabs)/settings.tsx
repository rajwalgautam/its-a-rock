import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useRouteStore } from '@/store/useRouteStore';

export default function SettingsScreen(): React.JSX.Element {
  const clearAll = useRouteStore((state) => state.clearAll);

  function confirmReset(): void {
    Alert.alert('Reset all data?', 'This deletes local routes, tags, and gyms from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void clearAll();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Offline first</Text>
          <Text style={styles.body}>Routes, gyms, tags, notes, and stats stay in local SQLite storage on this device.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photo references</Text>
          <Text style={styles.body}>Route photos are referenced from the OS photo library when possible, instead of storing full photos in the app database.</Text>
        </View>
        <TouchableOpacity style={styles.danger} onPress={confirmReset}>
          <Text style={styles.dangerText}>Reset all local data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: COLORS.text,
  },
  card: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  body: {
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  danger: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  dangerText: {
    color: COLORS.danger,
    fontWeight: '900',
  },
});
