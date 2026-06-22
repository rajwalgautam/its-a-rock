import { shouldShowWhatsNew, stripUnderTheHood } from '@/utils/changelog';

const SAMPLE = `# v1.1.0

## What's new

- A shiny feature
- A fix

## Under the hood

- Internal note (#42)
`;

describe('stripUnderTheHood', () => {
  it('drops everything from the "Under the hood" heading onward', () => {
    const result = stripUnderTheHood(SAMPLE);
    expect(result).toContain('## What\'s new');
    expect(result).toContain('A shiny feature');
    expect(result).not.toContain('Under the hood');
    expect(result).not.toContain('Internal note');
  });

  it('trims trailing whitespace', () => {
    expect(stripUnderTheHood(SAMPLE).endsWith('A fix')).toBe(true);
  });

  it('matches the heading case-insensitively', () => {
    const md = 'Notes\n## UNDER THE HOOD\nsecret';
    expect(stripUnderTheHood(md)).toBe('Notes');
  });

  it('returns the whole text (trimmed) when the heading is absent', () => {
    const md = '# v1.0.0\n\n## What\'s new\n\n- Only user notes\n';
    expect(stripUnderTheHood(md)).toBe(md.trim());
  });
});

describe('shouldShowWhatsNew', () => {
  it('shows nothing on a fresh install (no stored version)', () => {
    expect(shouldShowWhatsNew(null, '1.1.0')).toBe(false);
  });

  it('shows the popup after an update (stored differs from current)', () => {
    expect(shouldShowWhatsNew('1.0.0', '1.1.0')).toBe(true);
  });

  it('shows nothing when the stored version matches the current one', () => {
    expect(shouldShowWhatsNew('1.1.0', '1.1.0')).toBe(false);
  });
});
