import { formatLastChecked, isNewerVersion } from '@/utils/versionCompare';

describe('isNewerVersion', () => {
  it('treats higher patch as newer', () => {
    expect(isNewerVersion('0.1.8', '0.1.7')).toBe(true);
  });

  it('treats higher minor as newer than any older minor patch', () => {
    expect(isNewerVersion('0.2.0', '0.1.99')).toBe(true);
  });

  it('treats higher major as newer', () => {
    expect(isNewerVersion('1.0.0', '0.99.99')).toBe(true);
  });

  it('treats equal versions as not newer', () => {
    expect(isNewerVersion('0.1.7', '0.1.7')).toBe(false);
  });

  it('treats older versions as not newer', () => {
    expect(isNewerVersion('0.1.6', '0.1.7')).toBe(false);
    expect(isNewerVersion('0.1.0', '0.2.0')).toBe(false);
  });

  it('strips a leading "v"', () => {
    expect(isNewerVersion('v0.2.0', '0.1.7')).toBe(true);
    expect(isNewerVersion('0.2.0', 'v0.1.7')).toBe(true);
  });

  it('treats missing trailing segments as zero', () => {
    expect(isNewerVersion('0.2', '0.1.99')).toBe(true);
    expect(isNewerVersion('0.1', '0.1.0')).toBe(false);
  });

  it('treats a -N build suffix as newer than the bare base version', () => {
    expect(isNewerVersion('0.2.3-1', '0.2.3')).toBe(true);
    expect(isNewerVersion('0.2.3', '0.2.3-1')).toBe(false);
    expect(isNewerVersion('0.2.3-2', '0.2.3-1')).toBe(true);
  });

  it('ranks a higher base above any -N build of a lower base', () => {
    expect(isNewerVersion('0.2.4', '0.2.3-1')).toBe(true);
    expect(isNewerVersion('0.2.3-9', '0.2.4')).toBe(false);
  });

  it('treats a non-numeric suffix (e.g. -rerelease) as equal to the base', () => {
    expect(isNewerVersion('0.2.3-rerelease', '0.2.3')).toBe(false);
  });
});

describe('formatLastChecked', () => {
  it('returns "Never checked" when no date', () => {
    expect(formatLastChecked(null)).toBe('Never checked');
  });

  it('includes the date and time in the formatted string', () => {
    const date = new Date(2026, 4, 26, 15, 42);
    const result = formatLastChecked(date);
    expect(result).toMatch(/^Last checked: /);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/at /);
  });
});
