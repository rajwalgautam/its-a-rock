import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { RouteForm } from '@/components/RouteForm';
import { useRouteStore } from '@/store/useRouteStore';
import type { MediaItem, RouteInput, RouteWithGym } from '@/types';

export default function NewRoute(): React.JSX.Element {
  const { colors } = useTheme();
  const { uri, type } = useLocalSearchParams<{ uri?: string; type?: string }>();
  const addRoute = useRouteStore((s) => s.addRoute);
  const editRoute = useRouteStore((s) => s.editRoute);
  // Once a draft is persisted (e.g. to plan a note), keep updating that row
  // instead of creating duplicate climbs.
  const createdId = useRef<number | null>(null);

  const initialMedia: MediaItem[] | undefined =
    uri !== undefined
      ? [{ uri, type: type === 'video' ? 'video' : 'photo', width: null, height: null }]
      : undefined;

  async function persistDraft(input: RouteInput): Promise<RouteWithGym> {
    if (createdId.current === null) {
      const route = await addRoute(input);
      createdId.current = route.id;
      return route;
    }
    return editRoute(createdId.current, input);
  }

  async function handleSubmit(input: RouteInput): Promise<void> {
    await persistDraft(input);
    router.back();
  }

  // RouteForm owns its own scroll + keyboard-avoiding layout (pinned footer).
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <RouteForm
        initialMedia={initialMedia}
        submitLabel="Add climb"
        onSubmit={handleSubmit}
        onPersistDraft={persistDraft}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
