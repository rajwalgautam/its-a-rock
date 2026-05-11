import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ROUTE_TAGS } from '@/constants/tags';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { RouteForm } from '@/components/RouteForm';
import { useRouteStore } from '@/store/useRouteStore';
import { RouteInput, RouteWithRelations } from '@/types';
import { formatFullDate } from '@/utils/dateUtils';
import { formatAttempts } from '@/utils/formatters';

export default function RouteDetailScreen(): React.JSX.Element {
  const { id, fromCreate } = useLocalSearchParams<{ id: string; fromCreate?: string }>();
  const routeId = Number(id);
  const getRoute = useRouteStore((state) => state.getRoute);
  const editRoute = useRouteStore((state) => state.editRoute);
  const removeRoute = useRouteStore((state) => state.removeRoute);
  const gyms = useRouteStore((state) => state.gyms);
  const loadGyms = useRouteStore((state) => state.loadGyms);
  const [route, setRoute] = useState<RouteWithRelations | null>(null);
  const [editing, setEditing] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    void loadGyms();
    void getRoute(routeId).then(setRoute);
  }, [getRoute, loadGyms, routeId]);

  async function handleEdit(input: RouteInput): Promise<void> {
    try {
      const updated = await editRoute(routeId, input);
      setRoute(updated);
      setEditing(false);
    } catch (error) {
      Alert.alert('Could not update route', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function goToRoutes(): void {
    router.replace('/(tabs)');
  }

  function handleBack(): void {
    if (fromCreate === '1' || !router.canGoBack()) {
      goToRoutes();
      return;
    }
    router.back();
  }

  function confirmDelete(): void {
    Alert.alert('Delete route?', 'This removes the route from your local log.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void removeRoute(routeId).then(goToRoutes);
        },
      },
    ]);
  }

  if (route === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Loading route...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (editing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={styles.link}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit route</Text>
          <View style={styles.headerSpacer} />
        </View>
        <RouteForm gyms={gyms} initialRoute={route} submitLabel="Update route" onSubmit={handleEdit} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.link}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photo}>
          {route.photoUri && !imageFailed ? (
            <Image source={{ uri: route.photoUri }} style={styles.image} onError={() => setImageFailed(true)} />
          ) : (
            <Text style={styles.photoText}>{route.photoUri ? 'Photo unavailable' : 'No route photo'}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{route.name}</Text>
          <Text style={styles.meta}>{route.gym.name}</Text>
          <Text style={styles.meta}>{route.grade} · {formatFullDate(route.climbedAt)}</Text>
          <View style={styles.row}>
            <Text style={[styles.status, route.completed ? styles.sent : styles.project]}>
              {route.completed ? 'Completed' : 'Project'}
            </Text>
            <Text style={styles.meta}>{formatAttempts(route.attempts)}</Text>
          </View>
          {route.tags.length > 0 && (
            <View style={styles.tags}>
              {route.tags.map((tagId) => (
                <Text key={tagId} style={styles.tag}>{ROUTE_TAGS[tagId].label}</Text>
              ))}
            </View>
          )}
          {route.notes ? <Text style={styles.notes}>{route.notes}</Text> : <Text style={styles.emptyText}>No notes yet.</Text>}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete route</Text>
        </TouchableOpacity>
      </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 48,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  photo: {
    height: 260,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  card: {
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  meta: {
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.surface,
    fontWeight: '900',
  },
  sent: {
    backgroundColor: COLORS.success,
  },
  project: {
    backgroundColor: COLORS.warning,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.chip,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontWeight: '700',
  },
  notes: {
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  deleteButton: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  deleteText: {
    color: COLORS.danger,
    fontWeight: '900',
  },
});
