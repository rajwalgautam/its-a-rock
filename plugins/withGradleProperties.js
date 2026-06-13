const { withGradleProperties } = require('@expo/config-plugins');

// Inject Gradle properties at prebuild time so they live in the generated
// android/gradle.properties from the first configuration pass — instead of
// being appended at CI runtime, which the prebuild cache would otherwise hide
// from the first build that hits a cache. Restricting reactNativeArchitectures
// to arm64-v8a alone cuts native compile time roughly 4x (skips armeabi-v7a,
// x86, x86_64). All Play-distributed Android devices since Aug 2019 are arm64.
const PROPERTIES = [
  { key: 'org.gradle.caching', value: 'true' },
  { key: 'org.gradle.parallel', value: 'true' },
  { key: 'org.gradle.daemon', value: 'true' },
  { key: 'org.gradle.jvmargs', value: '-Xmx4g -XX:MaxMetaspaceSize=512m' },
  { key: 'reactNativeArchitectures', value: 'arm64-v8a' },
];

module.exports = function withCustomGradleProperties(config) {
  return withGradleProperties(config, (cfg) => {
    for (const { key, value } of PROPERTIES) {
      const existing = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (existing) {
        existing.value = value;
      } else {
        cfg.modResults.push({ type: 'property', key, value });
      }
    }
    return cfg;
  });
};
