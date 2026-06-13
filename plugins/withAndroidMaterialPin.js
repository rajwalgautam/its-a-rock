const { withProjectBuildGradle } = require('@expo/config-plugins');

// material-1.13.0 ships @null as a <color> value that AAPT2 rejects during
// mergeReleaseResources. Pin to 1.12.0 until a compatible AGP/AAPT2 is in use.
module.exports = function withAndroidMaterialPin(config, { version = '1.12.0' } = {}) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    const marker = `force 'com.google.android.material:material:`;
    if (contents.includes(marker)) {
      return config;
    }

    const resolutionBlock = `
  configurations.all {
    resolutionStrategy {
      force 'com.google.android.material:material:${version}'
    }
  }`;

    // Insert inside allprojects {}, after the repositories block.
    contents = contents.replace(
      "maven { url 'https://www.jitpack.io' }\n  }\n}",
      `maven { url 'https://www.jitpack.io' }\n  }${resolutionBlock}\n}`,
    );

    config.modResults.contents = contents;
    return config;
  });
};
