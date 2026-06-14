import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  useEffect(() => {
    void loadGyms();
    void loadRoutes();
  }, [loadGyms, loadRoutes]);

  useEffect(() => {
    if (value.length === 0 && routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      if (lastRoute?.gym.name) {
        onChange(lastRoute.gym.name);
      }
    }
  }, [routes, value, onChange]);

  const suggestions = gyms
    .filter(
      (g) =>
        value.length > 0 &&
        g.name.toLowerCase().includes(value.toLowerCase()),
    )
    .slice(0, 5)
    .sort((a, b) => a.name.localeCompare(b.name));

  const hasMatches = suggestions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputColors(colors)]}
        />
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textMuted}
          style={styles.dropdownIcon}
          pointerEvents="none"
        />
      </View>
      {showDropdown && value.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {hasMatches ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => `${item.id}`}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.name);
                    setShowDropdown(false);
                  }}
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
              )}
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                No matching locations
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
  dropdownIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    maxHeight: 200,
    zIndex: 10,
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
