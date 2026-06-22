import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { RouteCard } from '@/components/RouteCard';
import { useRouteStore } from '@/store/useRouteStore';
import type { RouteWithGym } from '@/types';

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; route: RouteWithGym };

export default function RouteDetail(): React.JSX.Element {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const getRoute = useRouteStore((s) => s.getRoute);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const id = Number(params.id);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!Number.isFinite(id)) {
          if (active) setState({ status: 'missing' });
          return;
        }
        const route = await getRoute(id);
        if (!active) return;
        setState(route === null ? { status: 'missing' } : { status: 'ready', route });
      })();
      return () => {
        active = false;
      };
    }, [id, getRoute]),
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {state.status === 'loading' && <ActivityIndicator color={colors.primary} style={styles.center} />}
      {state.status === 'missing' && (
        <View style={styles.center}>
          <Text style={[styles.missing, { color: colors.textSecondary }]}>
            This climb couldn&apos;t be found.
          </Text>
        </View>
      )}
      {state.status === 'ready' && (
        <RouteCard route={state.route} onSaved={(route) => setState({ status: 'ready', route })} />
      )}
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
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  missing: {
    fontSize: FONT_SIZE.md,
  },
});
