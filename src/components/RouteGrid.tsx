import { type ReactElement } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { RouteTile } from '@/components/RouteTile';
import type { MenuAnchor } from '@/components/RouteContextMenu';
import type { RouteWithGym } from '@/types';

interface RouteGridProps {
  routes: RouteWithGym[];
  onTilePress: (route: RouteWithGym) => void;
  onTileLongPress: (route: RouteWithGym, anchor: MenuAnchor) => void;
  /** Rendered above the grid and scrolled with it (stats row, controls, …). */
  ListHeaderComponent?: ReactElement;
  /** Rendered when there are no routes. */
  ListEmptyComponent?: ReactElement;
}

const GAP = SPACING.sm;
const EDGE = SPACING.lg;

/** FlatList grid of RouteTiles; column count comes from the settings store. */
export function RouteGrid({
  routes,
  onTilePress,
  onTileLongPress,
  ListHeaderComponent,
  ListEmptyComponent,
}: RouteGridProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const columns = useSettingsStore((s) => s.columnDensity);

  const tileSize = Math.floor((width - EDGE * 2 - GAP * (columns - 1)) / columns);

  return (
    <FlatList
      // Remount when the column count changes (FlatList can't change numColumns live).
      key={columns}
      data={routes}
      keyExtractor={(item) => String(item.id)}
      numColumns={columns}
      renderItem={({ item }) => (
        <RouteTile
          route={item}
          size={tileSize}
          onPress={onTilePress}
          onLongPress={onTileLongPress}
        />
      )}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: EDGE,
    gap: GAP,
    flexGrow: 1,
  },
  columnWrapper: {
    gap: GAP,
  },
});
