import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ROUTE_TAG_ORDER, ROUTE_TAGS } from '@/constants/tags';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { RouteCard } from '@/components/RouteCard';
import { useRouteStore } from '@/store/useRouteStore';

export default function RoutesScreen(): React.JSX.Element {
  const {
    routes,
    gyms,
    isLoading,
    error,
    searchQuery,
    selectedGymId,
    completedFilter,
    selectedTagIds,
    loadRoutes,
    loadGyms,
    setSearchQuery,
    setSelectedGymId,
    setCompletedFilter,
    toggleTagFilter,
    clearFilters,
  } = useRouteStore();

  useEffect(() => {
    void loadGyms();
    void loadRoutes();
  }, [loadGyms, loadRoutes]);

  useEffect(() => {
    void loadRoutes();
  }, [completedFilter, loadRoutes, searchQuery, selectedGymId, selectedTagIds]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Offline log</Text>
            <Text style={styles.title}>It's A Rock</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/add')}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search routes"
          placeholderTextColor={COLORS.textMuted}
          style={styles.search}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'completed', 'not_completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, completedFilter === filter && styles.filterChipOn]}
              onPress={() => setCompletedFilter(filter)}
            >
              <Text style={[styles.filterText, completedFilter === filter && styles.filterTextOn]}>
                {filter === 'all' ? 'All' : filter === 'completed' ? 'Sent' : 'Projects'}
              </Text>
            </TouchableOpacity>
          ))}
          {gyms.map((gym) => (
            <TouchableOpacity
              key={gym.id}
              style={[styles.filterChip, selectedGymId === gym.id && styles.filterChipOn]}
              onPress={() => setSelectedGymId(selectedGymId === gym.id ? null : gym.id)}
            >
              <Text style={[styles.filterText, selectedGymId === gym.id && styles.filterTextOn]}>{gym.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {ROUTE_TAG_ORDER.slice(0, 10).map((tagId) => {
            const selected = selectedTagIds.includes(tagId);
            return (
              <TouchableOpacity
                key={tagId}
                style={[styles.filterChip, selected && styles.filterChipOn]}
                onPress={() => toggleTagFilter(tagId)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextOn]}>{ROUTE_TAGS[tagId].label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {(searchQuery || selectedGymId || completedFilter !== 'all' || selectedTagIds.length > 0) && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clear}>Clear filters</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {isLoading && <ActivityIndicator color={COLORS.primary} />}

        {!isLoading && routes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptyText}>Add your first boulder problem and build a local climbing history.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} onPress={() => router.push(`/routes/${route.id}`)} />
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  addText: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  search: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
  },
  filters: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  filterChip: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  filterTextOn: {
    color: COLORS.surface,
  },
  clear: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  error: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  list: {
    gap: SPACING.md,
  },
  empty: {
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
