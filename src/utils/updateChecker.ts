// PLACEHOLDER — the real in-app update mechanism is ported from water-tracker
// in issue #33 (points at rajwalgautam/its-a-rock releases, adds download/
// install + last-checked persistence). This stub keeps useUpdateStore verbatim
// and type-correct until then; it reports "no update available".

export const RELEASES_REPO = 'rajwalgautam/its-a-rock';

export interface UpdateCheckResult {
  isNewer: boolean;
  remoteVersion: string | null;
}

export async function performUpdateCheck(): Promise<UpdateCheckResult> {
  return { isNewer: false, remoteVersion: null };
}

export async function getLastNotifiedVersion(): Promise<string | null> {
  return null;
}

export async function markVersionNotified(_version: string): Promise<void> {
  // no-op until #33
}
