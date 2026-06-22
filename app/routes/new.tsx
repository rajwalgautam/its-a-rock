import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { RouteForm } from '@/components/RouteForm';
import { useRouteStore } from '@/store/useRouteStore';
import type { MediaItem, RouteInput } from '@/types';

export default function NewRoute(): React.JSX.Element {
  const { colors } = useTheme();
  const { uri, type } = useLocalSearchParams<{ uri?: string; type?: string }>();
  const addRoute = useRouteStore((s) => s.addRoute);

  const initialMedia: MediaItem[] | undefined =
    uri !== undefined
      ? [{ uri, type: type === 'video' ? 'video' : 'photo', width: null, height: null }]
      : undefined;

  async function handleSubmit(input: RouteInput): Promise<void> {
    await addRoute(input);
    router.back();
  }

  // RouteForm owns its own scroll + keyboard-avoiding layout (pinned footer).
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <RouteForm
        initialMedia={initialMedia}
        submitLabel="Add climb"
        onSubmit={handleSubmit}
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
