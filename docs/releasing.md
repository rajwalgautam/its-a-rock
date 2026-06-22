# Releasing a new version

It's A Rock is released as a signed Android APK published as a **GitHub Release
in this repo** (`rajwalgautam/its-a-rock`). Releases are cut by the
**CI / Release** GitHub Actions workflow
([`.github/workflows/android-apk-release.yml`](../.github/workflows/android-apk-release.yml)),
which you trigger manually once your changes are merged to `main`.

> **Difference from water-tracker.** water-tracker publishes to a separate
> private release repo using a cross-repo PAT (`RELEASE_REPO_TOKEN`). It's A Rock
> publishes to itself using the workflow's built-in `GITHUB_TOKEN` (with
> `permissions: contents: write`). There is **no** `RELEASE_REPO_TOKEN`.

This doc covers signing setup, the normal release flow, re-releases, and the
local device deploy used for testing.

## Versioning

- Versions are `vMAJOR.MINOR.PATCH` (e.g. `v0.2.0`). The leading `v` is used for
  git tags and changelog filenames; `app.json` stores the bare number (`0.2.0`).
- **You do not edit `app.json` by hand.** The release workflow sets the version
  during the build; `app.json` on the repo stays at `0.0.0` and is never committed.
- One changelog file per version lives in [`changelogs/`](../changelogs), named
  `vX.Y.Z.md`.

## One-time signing setup

The release build is signed with a keystore that **must not** be committed
(`.gitignore` already excludes `*.jks` / `*.keystore` / credentials). Generate a
**new** keystore for It's A Rock (do not reuse water-tracker's).

`keytool` ships with a JDK. macOS has a stub `/usr/bin/java` that only prompts
you to install Java, so `keytool` fails with *"Unable to locate a Java
Runtime"* until a real JDK is present. Use whichever you have:

- **Android Studio's bundled JDK** (no install — easiest if you already build
  Android locally):

  ```sh
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" \
    -genkeypair -v \
    -keystore its-a-rock-release.jks \
    -alias its-a-rock \
    -keyalg RSA -keysize 2048 -validity 10000
  ```

- **A standalone JDK 17** (also required for local Gradle release builds, so
  recommended if you'll run `scripts/deploy-pixel.sh --release`):

  ```sh
  brew install --cask temurin@17
  # new shell, or: export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  keytool -genkeypair -v \
    -keystore its-a-rock-release.jks \
    -alias its-a-rock \
    -keyalg RSA -keysize 2048 -validity 10000
  ```

`keytool` will prompt for a keystore password and the key's distinguished-name
fields; remember the password and alias — you need them for the secrets below.

Then add these four repository secrets
(**Settings → Secrets and variables → Actions**):

| Secret | Value |
| ------ | ----- |
| `KEYSTORE_BASE64` | `base64 -i its-a-rock-release.jks` (the keystore, base64-encoded) |
| `KEYSTORE_PASSWORD` | the keystore password you chose |
| `KEY_ALIAS` | the key alias (e.g. `its-a-rock`) |
| `KEY_PASSWORD` | the key password |

The workflow decodes `KEYSTORE_BASE64` to `android/app/release.keystore` at build
time; [`plugins/withAndroidSigning.js`](../plugins/withAndroidSigning.js) wires
the `release` signingConfig to read these from the environment. Keep the keystore
file somewhere safe — you need the **same** keystore to ship updates that install
over an existing install.

## Before you release

1. Make sure all the work for the version is merged into `main` and CI is green.
   Tests + typecheck run on every push and PR.
2. Add a changelog entry at `changelogs/vX.Y.Z.md`:
   - A `## What's new` section written for users — this becomes the release notes.
   - An optional `## Under the hood` section for internal notes. **This section
     and everything after it is stripped from the published release notes.**
3. Commit the changelog to `main`. Changelog-only and Markdown-only changes don't
   trigger a CI build (`paths-ignore`), so they're cheap to land.

> **The changelog is required.** The release workflow refuses to build a version
> that has no matching `changelogs/<version>.md` — and the filename must match the
> dispatched version **including the leading `v`** (e.g. `v1.0.0` →
> `changelogs/v1.0.0.md`; for a `-rerelease`, the base version's changelog). The
> check runs **before** the tag is created, so a typo like `v0.50` fails fast and
> publishes nothing.

## Cutting the release

1. Go to **Actions → CI / Release → Run workflow** on GitHub.
2. Enter the version, e.g. `v0.2.0`, and run it on `main`.

The workflow then:

1. Runs typecheck + the test suite (release is blocked if either fails).
2. Creates and pushes the `vX.Y.Z` git tag (an existing tag is force-replaced).
3. Builds a signed release APK with `expo prebuild` + `gradlew assembleRelease`,
   setting the app version in `app.json` for the build (changes are not committed).
4. Composes release notes from `changelogs/vX.Y.Z.md` (truncated at
   `## Under the hood`, with a link back to the full changelog).
5. Publishes the APK as a GitHub Release named `vX.Y.Z` **in this repo**.

If a release with that tag already exists, the build fails fast rather than
overwriting it.

## Re-releasing an existing version

If a published build is broken and you need to rebuild the **same** version
without changing any code, run the workflow with the version suffixed
`-rerelease`, e.g. `v0.2.0-rerelease`. This rebuilds the APK from the existing
`v0.2.0` tag and publishes it as a separate `v0.2.0-rerelease` Release. It does
**not** bump `app.json`, move the tag, or touch `main`. The base tag must already
exist or the run fails.

## Testing a build locally

To build and install on a connected Android device without going through CI, use
[`scripts/deploy-pixel.sh`](../scripts/deploy-pixel.sh):

```sh
# Debug build
./scripts/deploy-pixel.sh

# Signed release build (matches what CI ships)
./scripts/deploy-pixel.sh --release
```

Requires ADB, the Android SDK build tools, Java 17+, Node.js, and USB debugging
enabled on the device. See the script header for details.

## In-app updates

The app checks this repo's latest Release on startup and from
**Settings → About → Check for Updates**
([`src/utils/updateChecker.ts`](../src/utils/updateChecker.ts) points at
`rajwalgautam/its-a-rock`). When a newer version is published, an update banner
offers to download and install the APK.

## Troubleshooting

- **"Release `vX.Y.Z` already exists"** — the tag was already published. Use a
  new version, or re-release with the `-rerelease` suffix.
- **"Tag `vX.Y.Z` does not exist — cannot re-release"** — you asked for a
  re-release of a version that was never released. Do a normal release first.
- **"Missing changelogs/vX.Y.Z.md"** — the dispatched version has no matching
  changelog. Create `changelogs/vX.Y.Z.md` (filename must match the version,
  including the leading `v`) and commit it to `main`, then re-run. The workflow
  fails **before** creating the tag, so nothing was published.
- **Build failed** — check the workflow run; the `/build-failed` skill can
  diagnose the most recent release run.
