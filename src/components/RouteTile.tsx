import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { formatGradeLabel } from '@/utils/formatters';
import type { RouteWithGym } from '@/types';

interface RouteTileProps {
  route: RouteWithGym;
  /** Side length in px (tiles are square). */
  size: number;
  onPress: (route: RouteWithGym) => void;
  onLongPress: (route: RouteWithGym) => void;
}

/** A single grid tile: the climb photo with grade + location overlaid. */
export function RouteTile({ route, size, onPress, onLongPress }: RouteTileProps): React.JSX.Element {
  const { colors } = useTheme();
  const hasPhoto = route.photoUri !== null && route.photoUri.length > 0;
  const smallFont = size < 130;

  return (
    <Pressable
      onPress={() => onPress(route)}
      onLongPress={() => onLongPress(route)}
      accessibilityRole="button"
      accessibilityLabel={`${formatGradeLabel(route.grade)} at ${route.gym.name}`}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: size, backgroundColor: colors.tilePlaceholder, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {hasPhoto ? (
        <Image source={{ uri: route.photoUri! }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={size * 0.28} color={colors.textMuted} />
        </View>
      )}

      {route.completed && (
        <View style={[styles.sentBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      )}

      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Text
          style={[styles.grade, { color: colors.onOverlay, fontSize: smallFont ? FONT_SIZE.sm : FONT_SIZE.md }]}
          numberOfLines={1}
        >
          {formatGradeLabel(route.grade)}
        </Text>
        <Text style={[styles.location, { color: colors.onOverlay }]} numberOfLines={1}>
          {route.gym.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  grade: {
    fontWeight: '800',
  },
  location: {
    fontSize: FONT_SIZE.xs,
    opacity: 0.9,
  },
});
