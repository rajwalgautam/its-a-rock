import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouteStore } from '@/store/useRouteStore';
import { routeToInput } from '@/utils/routeInput';
import type { RouteWithGym } from '@/types';

/**
 * Returns a handler that opens the long-press contextual menu for a tile:
 * toggle sent/project, or delete (with confirmation).
 */
export function useRouteActions(): (route: RouteWithGym) => void {
  const editRoute = useRouteStore((s) => s.editRoute);
  const removeRoute = useRouteStore((s) => s.removeRoute);

  return useCallback(
    (route: RouteWithGym) => {
      const toggleLabel = route.completed ? 'Mark as project' : 'Mark as sent';
      Alert.alert(route.gym.name, route.grade ?? 'Ungraded', [
        {
          text: toggleLabel,
          onPress: () => {
            const nextCompleted = !route.completed;
            void editRoute(
              route.id,
              routeToInput(route, {
                completed: nextCompleted,
                completedAt: nextCompleted ? (route.completedAt ?? Date.now()) : null,
              }),
            );
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete this climb?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => void removeRoute(route.id),
              },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [editRoute, removeRoute],
  );
}
