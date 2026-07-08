# Publishing to F-Droid

This document tracks what It's A Rock needs to be accepted into the main F-Droid
repository, and how the F-Droid build differs from the GitHub-release build.

F-Droid's [Inclusion Policy](https://f-droid.org/en/docs/Inclusion_Policy/) and
[Quick Start guide](https://f-droid.org/en/docs/Submitting_to_F-Droid_Quick_Start_Guide/)
are the source of truth; this is the app-specific mapping.

## Compliance checklist

| Requirement | Status | Notes |
| --- | --- | --- |
| Public source repo with real, up-to-date code | ✅ | This repo. |
| FOSS license file | ✅ | [MIT](../LICENSE), also declared in `package.json`. |
| Only FOSS dependencies | ✅ | No Firebase / GMS / Play Services. All Expo/RN deps are FOSS. |
| FOSS build tools (command-line, no proprietary IDE) | ✅ | Gradle + Expo CLI. |
| Author does not oppose inclusion | ✅ | Author is the repo owner. |
| Fastlane/Triple-T metadata in repo | ✅ | [`fastlane/metadata/android/en-US/`](../fastlane/metadata/android/en-US). |
| No self-update / sideload anti-feature | ✅ (F-Droid flavor) | Updater stripped via build flag — see below. |
| Monotonic, unique `versionCode` per release | ✅ | Release workflow commits version + `versionCode` onto each tag — see below. |

## The F-Droid build flavor

The GitHub-distributed build checks this repo's Releases and can download &
sideload the update APK. F-Droid manages its own updates and treats in-app
self-updating as an anti-feature, so the F-Droid build must ship without it.

This is controlled by a single build-time env var:

```sh
EXPO_PUBLIC_ENABLE_INAPP_UPDATES=false
```

When set to `false`:

- [`src/constants/features.ts`](../src/constants/features.ts) sets
  `IN_APP_UPDATES_ENABLED = false`, which removes the startup update check
  ([`useUpdateStore`](../src/store/useUpdateStore.ts)), the update banner
  ([`UpdateBanner`](../src/components/UpdateBanner.tsx)), and the
  **Settings → Check for Updates** row.
- [`app.config.js`](../app.config.js) drops the
  `android.permission.REQUEST_INSTALL_PACKAGES` permission (only needed to
  install a downloaded APK).

Metro inlines `EXPO_PUBLIC_*` at bundle time, so the disabled code paths are
dead-code-eliminated from the release bundle. The default (unset) keeps the
updater on, so the existing GitHub release build is unchanged.

To produce a local F-Droid-equivalent build:

```sh
EXPO_PUBLIC_ENABLE_INAPP_UPDATES=false npx expo prebuild -p android --no-install
cd android && ./gradlew assembleRelease
```

## Version code

F-Droid requires each published APK to have a **unique, monotonically increasing
`versionCode`**, and it must be correct **at the git tag** (F-Droid builds from
the tag, not from CI).

The release workflow handles this: for a normal release it derives both values
from the dispatched tag and **commits them onto the tagged commit** — so checking
out `v1.5.2` yields an `app.json` with `version: "1.5.2"` and
`android.versionCode: 10502`. See
[`docs/releasing.md`](releasing.md#versioning). The scheme is:

```
versionCode = MAJOR * 10000 + MINOR * 100 + PATCH
# v1.5.2 -> 10502
```

The [recipe](../fdroid/com.itsarock.app.yml) and the fastlane changelog file
([`changelogs/10502.txt`](../fastlane/metadata/android/en-US/changelogs/10502.txt))
match this scheme.

> **Note on existing tags:** tags released *before* this change (≤ v1.5.x) were
> built with `versionCode 1` and a stale `versionName`. Point the recipe's first
> `Builds` entry at the first tag cut *after* this lands.

## The build recipe

A template of the fdroiddata metadata file lives at
[`fdroid/com.itsarock.app.yml`](../fdroid/com.itsarock.app.yml). It runs
`expo prebuild` (with the updater flag off) to generate `android/`, then builds
`assembleRelease` via Gradle.

Note: [`plugins/withGradleProperties.js`](../plugins/withGradleProperties.js)
restricts `reactNativeArchitectures` to `arm64-v8a`. That is fine for modern
devices but excludes 32-bit ABIs; decide whether the F-Droid build should widen
this (F-Droid supports per-ABI version codes).

## Submitting

1. Resolve the version-code TODO above.
2. Fork [fdroiddata](https://gitlab.com/fdroid/fdroiddata), copy
   `fdroid/com.itsarock.app.yml` to `metadata/com.itsarock.app.yml`.
3. Validate locally: `fdroid lint com.itsarock.app` and
   `fdroid build -v -l com.itsarock.app`.
4. Open a merge request against fdroiddata.

Because the author is the repo owner, no separate permission issue is required.
