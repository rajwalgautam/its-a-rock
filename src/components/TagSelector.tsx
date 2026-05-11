import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROUTE_TAG_ORDER, ROUTE_TAGS } from '@/constants/tags';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { RouteTagId } from '@/types';

interface Props {
  selectedTagIds: RouteTagId[];
  onToggle: (tagId: RouteTagId) => void;
}

export function TagSelector({ selectedTagIds, onToggle }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <View style={styles.tags}>
        {ROUTE_TAG_ORDER.map((tagId) => {
          const tag = ROUTE_TAGS[tagId];
          const selected = selectedTagIds.includes(tagId);
          return (
            <TouchableOpacity
              key={tagId}
              style={[styles.tag, selected && { backgroundColor: tag.color, borderColor: tag.color }]}
              onPress={() => onToggle(tagId)}
            >
              <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chip,
  },
  tagText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  tagTextSelected: {
    color: COLORS.surface,
  },
});
