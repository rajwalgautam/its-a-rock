import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RouteForm } from '@/components/RouteForm';
import { useRouteStore } from '@/store/useRouteStore';
import type { RouteInput } from '@/types';

export default function NewRoute(): React.JSX.Element {
  const { colors } = useTheme();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const addRoute = useRouteStore((s) => s.addRoute);

  async function handleSubmit(input: RouteInput): Promise<void> {
    await addRoute(input);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <RouteForm
          initialPhotoUri={photoUri}
          submitLabel="Add climb"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
});
