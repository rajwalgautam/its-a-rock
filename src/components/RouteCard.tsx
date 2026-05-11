import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROUTE_TAGS } from '@/constants/tags';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { RouteWithRelations } from '@/types';
import { formatFullDate } from '@/utils/dateUtils';
import { formatAttempts } from '@/utils/formatters';

interface Props {
  route: RouteWithRelations;
  onPress?: () => void;
}

export function RouteCard({ route, onPress }: Props): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.thumb}>
        {route.photoUri && !imageFailed ? (
          <Image source={{ uri: route.photoUri }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : (
          <Text style={styles.thumbText}>Rock</Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{route.name}</Text>
          <Text style={[styles.badge, route.completed ? styles.badgeDone : styles.badgeProject]}>
            {route.completed ? 'Sent' : 'Project'}
          </Text>
        </View>
        <Text style={styles.meta}>{route.gym.name} · {route.grade} · {formatFullDate(route.climbedAt)}</Text>
        <Text style={styles.meta}>{formatAttempts(route.attempts)}</Text>
        {route.tags.length > 0 && (
          <View style={styles.tags}>
            {route.tags.slice(0, 3).map((tagId) => (
              <Text key={tagId} style={styles.tag}>{ROUTE_TAGS[tagId].label}</Text>
            ))}
            {route.tags.length > 3 && <Text style={styles.tag}>+{route.tags.length - 3}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOW,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  thumbText: {
    color: COLORS.textMuted,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    color: COLORS.surface,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  badgeDone: {
    backgroundColor: COLORS.success,
  },
  badgeProject: {
    backgroundColor: COLORS.warning,
  },
  meta: {
    color: COLORS.textMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tag: {
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.chip,
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});
