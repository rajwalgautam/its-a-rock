import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GYM_NAME_MAX_LENGTH } from '@/constants/limits';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { Gym } from '@/types';

interface Props {
  value: string;
  gyms: Gym[];
  onChange: (value: string) => void;
}

export function GymInput({ value, gyms, onChange }: Props): React.JSX.Element {
  const suggestions = gyms
    .filter((gym) => gym.name.toLowerCase().includes(value.trim().toLowerCase()))
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Gym</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Movement, The Cliffs, local gym..."
        placeholderTextColor={COLORS.textMuted}
        maxLength={GYM_NAME_MAX_LENGTH}
        style={styles.input}
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((gym) => (
            <TouchableOpacity key={gym.id} style={styles.suggestion} onPress={() => onChange(gym.name)}>
              <Text style={styles.suggestionText}>{gym.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestion: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.chip,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  suggestionText: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
