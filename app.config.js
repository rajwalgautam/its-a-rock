// Dynamic Expo config layered on top of the static app.json.
//
// The only job here is to make FOSS/F-Droid builds droppable: when the in-app
// updater is disabled (EXPO_PUBLIC_ENABLE_INAPP_UPDATES=false), the app no
// longer downloads or sideloads an APK, so it must not request the
// REQUEST_INSTALL_PACKAGES permission. Everything else stays in app.json.
//
// Keep in sync with src/constants/features.ts, which gates the updater UI/logic
// under the same env var.
const inAppUpdatesEnabled =
  process.env.EXPO_PUBLIC_ENABLE_INAPP_UPDATES !== 'false';

module.exports = ({ config }) => {
  if (!inAppUpdatesEnabled) {
    const android = config.android ?? {};
    config.android = {
      ...android,
      permissions: (android.permissions ?? []).filter(
        (permission) => permission !== 'android.permission.REQUEST_INSTALL_PACKAGES',
      ),
    };
  }
  return config;
};
