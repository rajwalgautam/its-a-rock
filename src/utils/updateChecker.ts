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

export { formatLastChecked, isNewerVersion } from "./versionCompare";

export const RELEASES_REPO = "rajwalgautam/its-a-rock";
const RELEASE_API_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`;
export const releaseTagUrl = (version: string): string =>
  `https://github.com/${RELEASES_REPO}/releases/tag/v${version.replace(/^v/, "")}`;

const STORAGE_KEYS = {
  lastChecked: "@itsarock/last_update_check_at",
  lastNotified: "@itsarock/last_notified_version",
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
