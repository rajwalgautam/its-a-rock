/**
 * Pure helpers for the in-app changelog ("What's new") features. Kept free of
 * React Native / network imports so they're unit-testable in the node project.
 */

const UNDER_THE_HOOD = /^##\s+Under the hood\s*$/im;

/**
 * Trim a changelog to its user-facing part by dropping everything from the
 * "## Under the hood" heading onward — mirroring the release workflow's release
 * notes. Returns the whole (trimmed) text when that heading is absent.
 */
export function stripUnderTheHood(markdown: string): string {
  const match = UNDER_THE_HOOD.exec(markdown);
  if (match === null) return markdown.trim();
  return markdown.slice(0, match.index).trim();
}

/**
 * Whether to show the "What's new" popup on launch. True only when a prior
 * version was recorded and it differs from the current one (i.e. just updated).
 * A null lastSeen means a fresh install — record it but show nothing.
 */
export function shouldShowWhatsNew(lastSeen: string | null, current: string): boolean {
  return lastSeen !== null && lastSeen !== current;
}
