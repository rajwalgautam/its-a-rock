/**
 * Build-time feature flags.
 *
 * The in-app updater (GitHub Release check + APK download & sideload) is enabled
 * by default for the self-distributed GitHub build. FOSS store builds — notably
 * F-Droid — must ship without it, since store-managed updates and sideloading an
 * APK are mutually exclusive (and F-Droid flags self-updating as an anti-feature).
 *
 * Set `EXPO_PUBLIC_ENABLE_INAPP_UPDATES=false` at build time to strip it. Metro
 * inlines `EXPO_PUBLIC_*` env vars at bundle time, so the disabled branches are
 * dead-code-eliminated from the release bundle.
 *
 * Keep this in sync with `app.config.js`, which drops the
 * `REQUEST_INSTALL_PACKAGES` permission under the same flag.
 */
export const IN_APP_UPDATES_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_INAPP_UPDATES !== 'false';
