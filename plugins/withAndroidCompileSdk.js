const { withProjectBuildGradle } = require('@expo/config-plugins');

// Expo 55's ExpoRootProjectPlugin uses setIfNotExist for both compileSdkVersion
// and buildToolsVersion, deriving buildTools as "${compileSdk}.0.0". Injecting
// both into ext before the plugin applies wins, so we can keep compileSdk 36
// while pinning buildTools to 35.0.0 whose AAPT2 correctly accepts @null color
// values used by material components (buildTools 36.0.0 rejects them).
module.exports = function withAndroidCompileSdk(
  config,
  { compileSdkVersion = 36, buildToolsVersion = '35.0.0' } = {},
) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (/compileSdkVersion\s*=\s*\d+/.test(contents)) {
      // Future-proof: if Expo ever writes it as text, update in place.
      contents = contents.replace(
        /compileSdkVersion\s*=\s*\d+/,
        `compileSdkVersion = ${compileSdkVersion}`,
      );
    } else {
      // Current Expo 55 behaviour: both values are set dynamically by
      // ExpoRootProjectPlugin via setIfNotExist. Injecting them here first
      // causes setIfNotExist to skip its defaults.
      contents = contents.replace(
        'apply plugin: "expo-root-project"',
        `ext { compileSdkVersion = ${compileSdkVersion}; buildToolsVersion = "${buildToolsVersion}" }\napply plugin: "expo-root-project"`,
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
