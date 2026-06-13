const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('signingConfigs')) {
      return config;
    }

    // Inject signingConfigs block reading credentials from env vars at Gradle build time
    contents = contents.replace(
      'android {',
      `android {\n    signingConfigs {\n        release {\n            storeFile file(System.getenv('KEYSTORE_PATH') ?: 'release.keystore')\n            storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''\n            keyAlias System.getenv('KEY_ALIAS') ?: ''\n            keyPassword System.getenv('KEY_PASSWORD') ?: ''\n        }\n    }`,
    );

    // Wire signingConfig into the release buildType
    contents = contents.replace(
      /buildTypes \{\s*release \{/,
      'buildTypes {\n        release {\n            signingConfig signingConfigs.release',
    );

    config.modResults.contents = contents;
    return config;
  });
};
