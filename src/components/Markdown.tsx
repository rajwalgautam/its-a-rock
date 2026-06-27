import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface MarkdownProps {
  source: string;
}

/**
 * Minimal Markdown renderer for changelog notes. Supports the subset the
 * changelog files use: ATX headings (#, ##, ###), `-`/`*` bullet lists, blank
 * lines as paragraph breaks, and inline **bold** / `code`. Deliberately tiny so
 * the app avoids a heavyweight markdown dependency.
 */
export function Markdown({ source }: MarkdownProps): React.JSX.Element {
  const { colors } = useTheme();
  // Trim surrounding whitespace and collapse runs of blank lines so multiple
  // consecutive newlines render as a single paragraph break, not stacked gaps.
  const lines = source
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .reduce<string[]>((acc, line) => {
      const isBlank = line.trim().length === 0;
      const prevBlank = acc.length > 0 && acc[acc.length - 1].trim().length === 0;
      if (isBlank && prevBlank) return acc;
      acc.push(line);
      return acc;
    }, []);

  return (
    <View style={styles.container}>
      {lines.map((line, i) => {
        const key = `md-${i}`;
        const trimmed = line.trim();

        if (trimmed.length === 0) return <View key={key} style={styles.gap} />;

        if (trimmed.startsWith('### ')) {
          return (
            <Text key={key} style={[styles.h3, { color: colors.textPrimary }]}>
              {renderInline(trimmed.slice(4), colors, key)}
            </Text>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={key} style={[styles.h2, { color: colors.textPrimary }]}>
              {renderInline(trimmed.slice(3), colors, key)}
            </Text>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <Text key={key} style={[styles.h1, { color: colors.textPrimary }]}>
              {renderInline(trimmed.slice(2), colors, key)}
            </Text>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <View key={key} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                {renderInline(trimmed.slice(2), colors, key)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={key} style={[styles.paragraph, { color: colors.textSecondary }]}>
            {renderInline(trimmed, colors, key)}
          </Text>
        );
      })}
    </View>
  );
}

/** Render inline **bold** and `code` spans within a line. */
function renderInline(
  text: string,
  colors: ReturnType<typeof useTheme>['colors'],
  keyBase: string,
): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p.length > 0);
  return parts.map((part, i) => {
    const key = `${keyBase}-i${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={key} style={{ fontWeight: '700', color: colors.textPrimary }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text key={key} style={[styles.code, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt }]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  gap: {
    height: SPACING.sm,
  },
  h1: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  h2: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  h3: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  paragraph: {
    fontSize: FONT_SIZE.md,
    lineHeight: FONT_SIZE.md * 1.4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  bullet: {
    fontSize: FONT_SIZE.md,
    lineHeight: FONT_SIZE.md * 1.4,
  },
  bulletText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    lineHeight: FONT_SIZE.md * 1.4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.sm,
  },
});
