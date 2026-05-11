import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RouteForm } from '@/components/RouteForm';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useRouteStore } from '@/store/useRouteStore';
import { RouteInput } from '@/types';

export default function AddRouteScreen(): React.JSX.Element {
  const gyms = useRouteStore((state) => state.gyms);
  const loadGyms = useRouteStore((state) => state.loadGyms);
  const addRoute = useRouteStore((state) => state.addRoute);

  useEffect(() => {
    void loadGyms();
  }, [loadGyms]);

  function handleClose(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }

  async function handleSubmit(input: RouteInput): Promise<void> {
    try {
      const route = await addRoute(input);
      router.replace({ pathname: '/routes/[id]', params: { id: String(route.id), fromCreate: '1' } });
    } catch (error) {
      Alert.alert('Could not save route', error instanceof Error ? error.message : 'Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Add route</Text>
          <Text style={styles.subtitle}>Log a climb without needing the internet.</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close add route screen"
        >
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </View>
      <RouteForm gyms={gyms} submitLabel="Save route" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeText: {
    color: COLORS.text,
    fontWeight: '900',
  },
});
