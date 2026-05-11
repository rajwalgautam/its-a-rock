export function normalizeGymName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function formatGymName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function isValidGymName(name: string): boolean {
  return normalizeGymName(name).length > 0;
}
