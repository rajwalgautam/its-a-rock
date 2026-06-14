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
  const loadGyms = useRouteStore((s) => s.loadGyms);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    void loadGyms();
  }, [loadGyms]);

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
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, inputColors(colors)]}
      />
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
                  style={[styles.suggestion, { borderBottomColor: colors.border }]}
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
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
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
    paddingVertical: SPACING.sm,
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
