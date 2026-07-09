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

- You dispatch a **base version** `vMAJOR.MINOR.PATCH` (e.g. `v0.2.0`). The
  workflow appends the unix time of the dispatch, so the actual tag, GitHub
  Release, and app version become `v0.2.0-<epoch>` (e.g. `v0.2.0-1751999999`).
  Every release is therefore unique and monotonically increasing — re-releasing
  is just dispatching the same base version again.
- **You do not edit `app.json` by hand.** The release workflow commits the
  version + `versionCode` bump (message `chore(release): vX.Y.Z-<epoch> [skip ci]`)
  and pushes it to **both `main` and the tag**. The tag carries the real version
  so external builders (e.g. F-Droid) that build from it get correct values, and
  `main` always reflects the latest released version.
- The Android `versionCode` is the epoch itself: unique, monotonic, and within
  the 32-bit limit until January 2038.
- One changelog file per **base** version lives in [`changelogs/`](../changelogs),
  named `vX.Y.Z.md` — the time suffix is never part of the filename.

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
| `RELEASE_DEPLOY_KEY` | private half of a write deploy key (see below) |

### Deploy key for pushing to main

`main` is protected by the "Protect main" ruleset (PRs with one approval
required), which the workflow's built-in `GITHUB_TOKEN` cannot bypass. The
version-bump push instead authenticates over SSH as a **write deploy key** that
has a bypass on the ruleset. To (re)create it:

```sh
ssh-keygen -t ed25519 -N "" -C "its-a-rock release workflow" -f release-deploy-key
gh repo deploy-key add release-deploy-key.pub --allow-write \
  --title "release-workflow: push version bump to main"
gh secret set RELEASE_DEPLOY_KEY < release-deploy-key
rm release-deploy-key release-deploy-key.pub
```

Then make sure **Settings → Rules → Rulesets → Protect main** lists
**Deploy keys** under "Bypass list". Rotating the key is just re-running the
commands above (delete the old deploy key in **Settings → Deploy keys**).

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
> that has no matching `changelogs/<base-version>.md` — and the filename must
> match the dispatched base version **including the leading `v`** (e.g. `v1.0.0`
> → `changelogs/v1.0.0.md`; the time suffix is never part of the filename). The
> check runs **before** the tag is created, so a typo like `v0.50` fails fast and
> publishes nothing.

## Cutting the release

1. Go to **Actions → CI / Release → Run workflow** on GitHub.
2. Enter the base version, e.g. `v0.2.0`, and run it on `main`.

The workflow then:

1. Runs typecheck + the test suite (release is blocked if either fails).
2. Appends the dispatch time to the version (`v0.2.0-<epoch>`), commits the
   `app.json` bump (version `0.2.0-<epoch>`, `versionCode` = epoch), pushes it
   to `main`, then creates and pushes the `v0.2.0-<epoch>` git tag on that
   commit. If `main` moved since the run started, the push fails before any tag
   is created — just re-run the workflow.
3. Builds a signed release APK with `expo prebuild` + `gradlew assembleRelease`
   from the tag.
4. Composes release notes from `changelogs/v0.2.0.md` (truncated at
   `## Under the hood`, with a link back to the full changelog).
5. Publishes the APK as a GitHub Release named `v0.2.0-<epoch>` **in this repo**.

## Re-releasing a version

There is no separate re-release mode: because every release tag is suffixed with
the dispatch time, just run the workflow again with the same base version (e.g.
`v0.2.0` again). It builds from the current `main`, gets a newer suffix and
`versionCode`, and the app's update check treats it as a normal upgrade.

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

- **"Missing changelogs/vX.Y.Z.md"** — the dispatched base version has no
  matching changelog. Create `changelogs/vX.Y.Z.md` (filename must match the
  base version, including the leading `v`, without the time suffix) and commit
  it to `main`, then re-run. The workflow fails **before** creating the tag, so
  nothing was published.
- **Push to `main` rejected** — either `main` moved while the run was in
  progress (just re-run), or the `RELEASE_DEPLOY_KEY` secret / its ruleset
  bypass is missing (see the deploy-key setup above).
- **Build failed** — check the workflow run; the `/build-failed` skill can
  diagnose the most recent release run.
