import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  cacheDirectory,
  deleteAsync,
  downloadAsync,
  getContentUriAsync,
} from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";
import { isNewerVersion } from "./versionCompare";
import { stripUnderTheHood } from "./changelog";

export { formatLastChecked, isNewerVersion } from "./versionCompare";

export const RELEASES_REPO = "rajwalgautam/its-a-rock";
const RELEASE_API_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`;
export const releaseTagUrl = (version: string): string =>
  `https://github.com/${RELEASES_REPO}/releases/tag/v${version.replace(/^v/, "")}`;
/** Public releases page, used as the "view all" link-out. */
export const releasesUrl = `https://github.com/${RELEASES_REPO}/releases`;
/** Raw changelog file for a tag — the single source of user-facing notes. */
export const changelogRawUrl = (version: string): string => {
  const v = version.replace(/^v/, "");
  return `https://raw.githubusercontent.com/${RELEASES_REPO}/v${v}/changelogs/v${v}.md`;
};

const STORAGE_KEYS = {
  lastChecked: "@itsarock/last_update_check_at",
  lastNotified: "@itsarock/last_notified_version",
  lastSeen: "@itsarock/last_seen_version",
  pendingApk: "@itsarock/pending_apk_path",
} as const;

export interface UpdateCheckResult {
  remoteVersion: string;
  currentVersion: string;
  isNewer: boolean;
}

export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

export async function performUpdateCheck(): Promise<UpdateCheckResult> {
  const res = await fetch(RELEASE_API_URL);
  if (!res.ok) throw new Error(`Update check failed: ${res.status}`);
  const data = (await res.json()) as { tag_name?: string };
  const remoteVersion = (data.tag_name ?? "").replace(/^v/, "");
  const currentVersion = getCurrentVersion();
  await AsyncStorage.setItem(STORAGE_KEYS.lastChecked, new Date().toISOString());
  return {
    remoteVersion,
    currentVersion,
    isNewer: isNewerVersion(remoteVersion, currentVersion),
  };
}

export async function getLastCheckedAt(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.lastChecked);
  if (raw === null) return null;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function getLastNotifiedVersion(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.lastNotified);
}

export async function markVersionNotified(version: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.lastNotified, version);
}

/** The app version whose "What's new" notes the user has already seen. */
export async function getLastSeenVersion(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.lastSeen);
}

export async function markVersionSeen(version: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.lastSeen, version);
}

/**
 * Fetch the user-facing changelog (truncated at "## Under the hood") for a
 * version's tag. Returns null on any network/parse error so callers degrade
 * gracefully — the app stays offline-first.
 */
export async function fetchChangelog(version: string): Promise<string | null> {
  try {
    const res = await fetch(changelogRawUrl(version));
    if (!res.ok) return null;
    return stripUnderTheHood(await res.text());
  } catch {
    return null;
  }
}

export interface ReleaseSummary {
  tag: string;
  name: string;
  /** ISO 8601 timestamp from the GitHub API. */
  publishedAt: string;
  url: string;
}

/** The most recent releases (newest first) from the GitHub releases API. */
export async function fetchRecentReleases(limit = 10): Promise<ReleaseSummary[]> {
  const res = await fetch(
    `https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=${limit}`,
  );
  if (!res.ok) throw new Error(`Failed to load releases: ${res.status}`);
  const data = (await res.json()) as Array<{
    tag_name?: string;
    name?: string;
    published_at?: string;
    html_url?: string;
  }>;
  return data.map((r) => ({
    tag: r.tag_name ?? "",
    name: r.name ?? r.tag_name ?? "",
    publishedAt: r.published_at ?? "",
    url: r.html_url ?? releasesUrl,
  }));
}

export async function findApkAssetUrl(): Promise<string | null> {
  const res = await fetch(RELEASE_API_URL);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    assets?: Array<{ name?: string; browser_download_url?: string }>;
  };
  const apk = data.assets?.find((a) => a.name?.endsWith(".apk"));
  return apk?.browser_download_url ?? null;
}

export interface InstallApkOptions {
  onProgress?: (fractionComplete: number) => void;
}

export async function downloadAndInstallApk(
  version: string,
  options: InstallApkOptions = {},
): Promise<void> {
  if (Platform.OS !== "android") {
    await Linking.openURL(releaseTagUrl(version));
    return;
  }
  const apkUrl = await findApkAssetUrl();
  if (apkUrl === null) {
    throw new Error("No APK asset found on the latest release.");
  }
  const baseDir = cacheDirectory;
  if (baseDir === null) {
    throw new Error("Cache directory unavailable.");
  }
  const dest = `${baseDir}update-${version.replace(/^v/, "")}.apk`;
  await deleteAsync(dest, { idempotent: true });
  await downloadAsync(apkUrl, dest);
  options.onProgress?.(1);
  await AsyncStorage.setItem(STORAGE_KEYS.pendingApk, dest);
  const contentUri = await getContentUriAsync(dest);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: "application/vnd.android.package-archive",
  });
}

export async function cleanupPendingApk(): Promise<void> {
  const savedPath = await AsyncStorage.getItem(STORAGE_KEYS.pendingApk);
  if (savedPath === null) return;
  await deleteAsync(savedPath, { idempotent: true });
  await AsyncStorage.removeItem(STORAGE_KEYS.pendingApk);
}
