import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';

interface LocationPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Searchable location/gym picker with dropdown suggestions. */
export function LocationPickerField({
  value,
  onChange,
  placeholder = 'Movement Englewood or Denver, CO',
}: LocationPickerFieldProps): React.JSX.Element {
  const { colors } = useTheme();
  const gyms = useRouteStore((s) => s.gyms);
  const routes = useRouteStore((s) => s.routes);
  const loadGyms = useRouteStore((s) => s.loadGyms);
  const loadRoutes = useRouteStore((s) => s.loadRoutes);
  const [showDropdown, setShowDropdown] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    void loadGyms();
    void loadRoutes();
  }, [loadGyms, loadRoutes]);

  useEffect(() => {
    if (!initializedRef.current && value.length === 0 && routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      if (lastRoute?.gym.name) {
        onChange(lastRoute.gym.name);
        initializedRef.current = true;
      }
    }
  }, [routes, onChange]);

  const isTyping = value.length > 0;

  // Empty field → browse all saved locations; typing → filter to matches.
  const sorted = [...gyms].sort((a, b) => a.name.localeCompare(b.name));
  const listed = isTyping
    ? sorted
        .filter((g) => g.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
    : sorted;

  function select(name: string): void {
    onChange(name);
    setShowDropdown(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setShowDropdown(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputColors(colors)]}
        />
        {isTyping ? (
          <Pressable
            onPress={() => {
              onChange('');
              setShowDropdown(true);
            }}
            style={styles.trailingButton}
            hitSlop={8}
            accessibilityLabel="Clear location"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setShowDropdown((s) => !s)}
            style={styles.trailingButton}
            hitSlop={8}
            accessibilityLabel="Show saved locations"
          >
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {listed.length > 0 ? (
            <ScrollView
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {listed.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => select(item.name)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    { borderBottomColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
                >
                  <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                {isTyping ? 'No matching locations' : 'No saved locations yet'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function inputColors(colors: ReturnType<typeof useTheme>['colors']) {
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.textPrimary,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingRight: 40,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  trailingButton: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  suggestion: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: FONT_SIZE.md,
  },
  noResults: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: FONT_SIZE.sm,
  },
});
