# It's A Rock — Project Blueprint

> **Purpose of this document.** This is the single source of truth for building
> **It's A Rock**, an offline-first Android app for tracking bouldering progress
> across multiple gyms. It is written to be cut into GitHub issues: every item
> in [Work breakdown](#work-breakdown) is self-contained and can be handed to an
> AI agent or a human cold. The app's structure, infra, and release process
> deliberately mirror the sibling **water-tracker** repo
> (`rajwalgautam/water-tracker`); where this doc says "like water-tracker," go
> read that repo for the concrete reference implementation.

---

## 1. Product vision

It's A Rock is a personal, **offline-first** bouldering logbook. A climber
photographs a boulder problem ("route"), tags it with a grade and the gym it's
at, and tracks whether they've sent it or are still projecting it. The app is
visual and tile-driven — the photo of the climb is the primary content, not a
row of text.

There is **no account, no backend, no network dependency** for core use. All
data lives in on-device SQLite. The only network calls are the optional
in-app update check (see [§8.7](#87-in-app-updates)).

### Core concepts

| Concept | Meaning |
| ------- | ------- |
| **Route** (a.k.a. climb / problem) | A single bouldering problem: photo, grade, gym/location, dates, notes, completion status. |
| **Project** | A route the user has **not** completed yet (`completed = false`). Surfaced on the My Climbing tab. |
| **Sent / Completed** | A route the user has finished (`completed = true`). |
| **Gym / Location** | Where the route is. Stored as a location string ("City, ST") or a named gym ("Movement Englewood"). |
| **Grade** | Bouldering difficulty on the V-scale with an optional `+`/`-` modifier (e.g. `V4`, `V4+`, `V4-`). |

### Three tabs

The app is a 3-tab layout (like water-tracker's tab bar, which uses
`expo-router` `Tabs`):

1. **My Climbing** — active projects + this-week stats + a floating `+` button.
2. **History** — every route, in the same tile grid, with adjustable density.
3. **Settings** — light/dark toggle + version / update section.

Adding a climb is a **floating `+` button**, not a tab (water-tracker had an Add
tab in an earlier iteration; we intentionally do not).

---

## 2. Tech stack & conventions

These match water-tracker exactly unless noted. **Read water-tracker's files as
the canonical reference** for each.

| Area | Choice | water-tracker reference |
| ---- | ------ | ----------------------- |
| Framework | Expo (SDK ~55), React Native 0.83.x, new architecture (`newArchEnabled: true`) | `app.json`, `package.json` |
| Language | TypeScript ~5.9, `strict: true` | `tsconfig.json` |
| Navigation | `expo-router` ~55, file-based, `experiments.typedRoutes: true` | `app/` |
| State | `zustand` ^5 | `src/store/` |
| Persistence | `expo-sqlite` (sync API, WAL mode) | `src/db/database.ts`, `src/db/queries.ts` |
| Local prefs | `@react-native-async-storage/async-storage` | `src/storage/`, `src/utils/updateChecker.ts` |
| Photos | `expo-image-picker` (library + camera) | _new for this app_ |
| Haptics | `expo-haptics` | used in components |
| Icons | `@expo/vector-icons` (Ionicons) | tab bar |
| Testing | Jest, two projects (`unit` ts-jest/node, `ui` jest-expo/jsdom) | `jest.config.js`, `docs/testing.md` |
| Module alias | `@/*` → `src/*` (babel-plugin-module-resolver + tsconfig paths) | `babel.config.js`, `jest.config.js` |
| Target platform | **Android only** for releases (iOS may run in dev but is not shipped) | release workflow |

### Code conventions (follow water-tracker)

- Components are function components returning `React.JSX.Element`, styled with
  `StyleSheet.create` at the bottom of the file.
- All colors, spacing, radii, font sizes, and shadows come from
  `src/constants/theme.ts` — **never hardcode** a hex or a pixel gap.
- Pure logic lives in `src/utils/` and `src/db/queries.ts` and is unit-tested.
  Screens/components stay thin.
- Stores expose async actions that call query functions and then update state;
  screens call store actions, never the DB directly.
- Use `SafeAreaView` from `react-native-safe-area-context` for screen roots.

---

## 3. Repository & project structure

Target layout (mirrors water-tracker). Items marked _(new)_ have no
water-tracker equivalent.

```
its-a-rock/
├── BLUEPRINT.md                  # this file
├── README.md
├── SECURITY.md                   # private vuln reporting (like the prior repo)
├── app.json                      # expo config; version bumped by CI only
├── package.json
├── tsconfig.json
├── babel.config.js               # expo preset + module-resolver @/ alias
├── jest.config.js                # two projects: unit + ui
├── app/                          # expo-router routes
│   ├── _layout.tsx               # root stack; theme provider; DB init; update check
│   ├── (tabs)/
│   │   ├── _layout.tsx           # 3-tab bar: My Climbing, History, Settings
│   │   ├── index.tsx             # My Climbing
│   │   ├── history.tsx           # History
│   │   └── settings.tsx          # Settings
│   └── routes/
│       ├── new.tsx               # add-climb screen (opened by the + button)
│       └── [id].tsx              # route detail / editable card
├── src/
│   ├── components/
│   │   ├── RouteTile.tsx         # grid tile (photo + grade + location)
│   │   ├── RouteCard.tsx         # reusable detail card with view/edit modes
│   │   ├── RouteGrid.tsx         # FlatList grid with 2–4 column density
│   │   ├── ColumnDensityControl.tsx
│   │   ├── StatCard.tsx          # small stat tile (like water-tracker StatCard)
│   │   ├── GradePicker.tsx       # V-scale + +/- modifier
│   │   ├── PhotoPickerField.tsx  # pick/take a photo
│   │   ├── FloatingAddButton.tsx # the + FAB
│   │   └── UpdateBanner.tsx      # in-app update prompt (like water-tracker)
│   ├── constants/
│   │   ├── theme.ts              # light + dark palettes, spacing, radius, fonts
│   │   └── grades.ts             # V-scale + modifier definitions
│   ├── db/
│   │   ├── database.ts           # openDatabaseSync + initDatabase (migrations)
│   │   └── queries.ts            # CRUD + stats queries
│   ├── store/
│   │   ├── useRouteStore.ts      # routes, projects, CRUD, filters
│   │   ├── useSettingsStore.ts   # theme mode, column density (persisted)
│   │   └── useUpdateStore.ts     # startup update check (like water-tracker)
│   ├── theme/
│   │   └── ThemeProvider.tsx     # (new) context exposing active palette + toggle
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── dateUtils.ts
│       ├── formatters.ts
│       ├── gradeUtils.ts
│       ├── routeStats.ts         # this-week stats, visits/week, sends/week
│       ├── versionCompare.ts     # (copy from water-tracker)
│       └── updateChecker.ts      # (adapt from water-tracker; points at this repo)
├── plugins/                      # config plugins (copy from water-tracker)
│   ├── withAndroidCompileSdk.js
│   ├── withAndroidMaterialPin.js
│   ├── withAndroidSigning.js
│   └── withGradleProperties.js
├── scripts/
│   └── deploy-pixel.sh           # local USB build/install (adapt from water-tracker)
├── changelogs/
│   └── vX.Y.Z.md                 # one per release
├── docs/
│   ├── releasing.md              # adapted from water-tracker (same-repo target)
│   └── testing.md                # copy from water-tracker
└── .github/
    ├── workflows/
    │   └── android-apk-release.yml   # CI + release (adapt from water-tracker)
    └── ISSUE_TEMPLATE/
        └── feature_request.md
```

---

## 4. Data model

Offline SQLite, opened with `expo-sqlite`'s sync API in WAL mode, exactly like
water-tracker's `src/db/database.ts`. Schema is created idempotently in
`initDatabase()` called from `app/_layout.tsx` on boot.

### 4.1 Tables

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS gyms (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,           -- "Movement Englewood" or "Denver, CO"
  normalized_name TEXT    NOT NULL UNIQUE,    -- lowercased/trimmed for dedupe
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT,                          -- optional; routes can be unnamed
  gym_id        INTEGER NOT NULL REFERENCES gyms(id),
  photo_uri     TEXT,                          -- local file URI (optional)
  photo_width   INTEGER,
  photo_height  INTEGER,
  grade         TEXT,                          -- e.g. "V4", "V4+", "V4-" (optional)
  completed     INTEGER NOT NULL DEFAULT 0,    -- 0 = project, 1 = sent
  notes         TEXT,
  started_at    INTEGER,                       -- optional: first attempt
  completed_at  INTEGER,                       -- optional: send date
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_gym       ON routes (gym_id);
CREATE INDEX IF NOT EXISTS idx_routes_completed ON routes (completed);
CREATE INDEX IF NOT EXISTS idx_routes_created   ON routes (created_at);
```

> **All route fields except `gym_id`, `completed`, and timestamps are optional**
> per the requirement that the card's fields are all optional. Validation lives
> in `src/utils` and is unit-tested.

### 4.2 TypeScript types (`src/types/index.ts`)

```ts
export type GradeBase =
  | 'VB' | 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
  | 'V6' | 'V7' | 'V8' | 'V9' | 'V10' | 'V11' | 'V12';
export type GradeModifier = '' | '+' | '-';

export interface Gym {
  readonly id: number;
  name: string;
  normalizedName: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoulderRoute {
  readonly id: number;
  name: string | null;
  gymId: number;
  photoUri: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  grade: string | null;          // serialized base+modifier, e.g. "V4+"
  completed: boolean;
  notes: string | null;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface RouteWithGym extends BoulderRoute {
  gym: Gym;
}

export interface RouteInput {
  name?: string | null;
  gymName: string;               // resolved/created into a gym row
  photoUri?: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  grade?: string | null;
  completed: boolean;
  notes?: string | null;
  startedAt?: number | null;
  completedAt?: number | null;
}

export interface WeeklyStats {
  weekStart: number;             // local midnight of the week's Monday
  visits: number;                // distinct days with >=1 route logged this week
  completedThisWeek: number;     // routes sent this week
  addedThisWeek: number;         // routes created this week
  activeProjects: number;        // current count of completed = false
}
```

### 4.3 Query layer (`src/db/queries.ts`)

Mirror water-tracker's `queries.ts` style (plain async functions over the sync
DB handle). Provide at minimum:

- `createRoute(input: RouteInput): Promise<RouteWithGym>` — upserts the gym by
  `normalizedName`, inserts the route, returns the joined row.
- `updateRoute(id, input): Promise<RouteWithGym>` — **persists edits** (see the
  edit-mode requirement).
- `deleteRoute(id): Promise<void>`
- `getRouteById(id): Promise<RouteWithGym | null>`
- `getRoutes(filters?): Promise<RouteWithGym[]>` — supports `completed`
  filtering (projects vs all), gym filter, and ordering by recency.
- `getProjects(): Promise<RouteWithGym[]>` — `completed = 0`, recent first.
- `getGyms(): Promise<Gym[]>`
- `getRoutesInRange(startMs, endMs): Promise<RouteWithGym[]>` — feeds weekly
  stats.
- `resetAllData(): Promise<void>`

---

## 5. Theming & dark mode

water-tracker ships **light-only** (`userInterfaceStyle: "light"`, a flat
`COLORS` const). It's A Rock adds a **user-controlled light/dark toggle**, which
is the one genuinely new architectural piece relative to water-tracker.

**Approach:**

- `src/constants/theme.ts` exports **two palettes** (`LIGHT`, `DARK`) with the
  same key set, plus shared `SPACING`, `RADIUS`, `FONT_SIZE`, `SHADOW`.
- `src/theme/ThemeProvider.tsx` provides a React context holding the active
  palette and a `mode: 'light' | 'dark' | 'system'`. A `useTheme()` hook returns
  `{ colors, mode, setMode }`.
- The chosen mode is persisted via `useSettingsStore` (AsyncStorage-backed) so it
  survives restarts.
- `app.json` sets `"userInterfaceStyle": "automatic"`; the in-app toggle
  overrides the system value when set to explicit light/dark.
- Components consume `useTheme().colors` rather than importing `COLORS`
  directly. (Net difference from water-tracker, which imports the const.)

> Keep the palette keys identical across light/dark so components never branch
> on mode — they just read `colors.x`.

---

## 6. Navigation & screens

### 6.1 Tab layout (`app/(tabs)/_layout.tsx`)

Three `Tabs.Screen`s, same construction as water-tracker's tab layout
(Ionicons via `@expo/vector-icons`, theme-driven active/inactive tints, safe-area
bottom inset):

| Route | Title | Icon (Ionicons) |
| ----- | ----- | --------------- |
| `index` | **My Climbing** | `barbell` / `body` |
| `history` | **History** | `time` |
| `settings` | **Settings** | `settings` |

### 6.2 My Climbing (`app/(tabs)/index.tsx`)

The home tab. Simple, large, visual.

- **This-week stats** at the top — a small row/grid of `StatCard`s:
  - Visits this week
  - Sends this week
  - Active projects
  - (optional) routes added this week

  Stats come from `useRouteStore` selectors backed by `routeStats.ts`.
- **Projects grid** — a `RouteGrid` of routes where `completed = false`, using
  `RouteTile`s. This is the heart of the screen.
- **Floating `+` button** (`FloatingAddButton`) bottom-right, navigates to
  `/routes/new`. Large, prominent, with haptic feedback on press.
- **Empty state** when there are no projects.

### 6.3 History (`app/(tabs)/history.tsx`)

Nearly identical to My Climbing's grid, but shows **all** routes (sent +
projects) and is the canonical place to browse everything.

- Same `RouteGrid` + `RouteTile` + `ColumnDensityControl` as My Climbing.
- Column density (2–4) is shared app-wide via `useSettingsStore` so both tabs
  stay in sync (the requirement says both tabs allow switching tile size).
- Tapping a tile opens the same route detail card (`/routes/[id]`).

### 6.4 Settings (`app/(tabs)/settings.tsx`)

Modeled on water-tracker's settings screen (sectioned cards, `SectionLabel`,
`Divider`), but trimmed to two sections:

- **Appearance** — Light / Dark / System segmented toggle (writes
  `useSettingsStore`).
- **About** — Version row (`Constants.expoConfig?.version`), "Check for Updates"
  row, and last-checked timestamp. This is a near-verbatim port of
  water-tracker's About section ([§8.7](#87-in-app-updates)).

### 6.5 Shared: the tile (`RouteTile`)

- Renders the **photo** of the climb as the tile background/fill (graceful
  fallback when no photo). 
- Overlays **grade** (incl. `+`/`-`) and **location** (`City, ST` or gym name).
- Sized to fit the current column count (2, 3, or 4 across). Square-ish aspect.
- **Tap** → open the route's card (`/routes/[id]`).
- **Long-press** → quick actions (e.g. toggle sent/project, delete) via an
  `ActionSheet`/`Alert`. (The original brief says "Long press on the tiles" —
  long-press opens a contextual action menu.)

### 6.6 Shared: the card (`RouteCard`) — reusable, editable, persistent

A single reusable component used by `/routes/[id]` (and reused wherever a route's
full detail is shown). Mirrors water-tracker's pattern of a screen that flips
between **view mode** and **edit mode** (see water-tracker's
`app/routes/[id].tsx` history / settings expand-collapse pattern for the
toggle idiom).

- **View mode** shows: photo, grade, location/gym, start date, end date,
  completion status, notes. Every field is optional and omitted gracefully when
  empty.
- **Edit mode** (toggled by an Edit button) swaps fields for inputs:
  `PhotoPickerField`, `GradePicker`, gym/location text input, date pickers,
  notes, sent/project switch.
- **Saving persists** through `useRouteStore.editRoute` → `updateRoute` query →
  SQLite, and the edited state survives app restarts (persistence is the
  acceptance bar here). On save, exit edit mode and reflect the new values.

### 6.7 Add climb (`app/routes/new.tsx`)

Opened by the floating `+`. Uses the **same form** the card uses in edit mode
(extract a `RouteForm`/shared field set so add and edit don't diverge). On
submit → `useRouteStore.addRoute` → navigate to the new route's card or back to
My Climbing.

---

## 7. State management

Three Zustand stores, same shape/idioms as water-tracker's stores.

- **`useRouteStore`** — `routes`, `projects`, `gyms`, `weeklyStats`, loading/error,
  and actions: `loadRoutes`, `loadProjects`, `loadGyms`, `getRoute`, `addRoute`,
  `editRoute`, `removeRoute`, `clearAll`. Actions call `queries.ts`, then refresh
  state. (Directly parallels water-tracker's `useWaterStore`.)
- **`useSettingsStore`** — `themeMode` and `columnDensity`, persisted to
  AsyncStorage; `setThemeMode`, `setColumnDensity`, `load`. (Parallels
  water-tracker's `useUserStore` persistence pattern in `src/storage/`.)
- **`useUpdateStore`** — startup update check; **copy water-tracker's
  `useUpdateStore.ts` almost verbatim** (it already has no app-specific logic
  beyond the checker it imports).

---

## 8. Infrastructure (mirror water-tracker)

> **Guiding principle:** the CI, build, caching, signing, versioning, changelog,
> and release machinery should be **extremely similar to water-tracker**, with
> exactly one intentional difference: **releases publish to this repo
> (`rajwalgautam/its-a-rock`) itself, not to a separate release repo.**

### 8.1 The one big difference: same-repo releases

water-tracker builds in `rajwalgautam/water-tracker` and **publishes the APK as
a GitHub Release in a separate private repo** `rajwalgautam/water-tracker-release`,
using a `RELEASE_REPO_TOKEN` secret and `softprops/action-gh-release` with a
`repository:` override.

For It's A Rock:

- **Publish to `rajwalgautam/its-a-rock`** (this repo). Drop the
  `repository:` override on `softprops/action-gh-release` so it targets the
  current repo, and use the workflow's built-in `GITHUB_TOKEN` (with
  `permissions: contents: write`) instead of a cross-repo PAT. The
  `RELEASE_REPO_TOKEN` secret is **not needed**.
- The "release already exists" pre-check (`gh release view <tag>`) runs against
  this repo (no `--repo` flag needed, or `--repo rajwalgautam/its-a-rock`).
- The in-app update checker ([§8.7](#87-in-app-updates)) points at
  `https://api.github.com/repos/rajwalgautam/its-a-rock/releases/latest`.

Everything else below is a faithful port of water-tracker's
`.github/workflows/android-apk-release.yml`.

### 8.2 CI / Release workflow

Single workflow `.github/workflows/android-apk-release.yml`, named
**`CI / Release`**, with the same three triggers and jobs as water-tracker:

**Triggers**
- `push` to `main` and `pull_request` to `main` → run tests. Use the same
  `paths-ignore` (`**.md`, `.github/ISSUE_TEMPLATE/**`, `changelogs/**`) so
  docs/changelog-only changes don't burn a build.
- `workflow_dispatch` with a `version` input (e.g. `v0.1.0`, or
  `v0.1.0-rerelease`).

**Jobs**
1. **`test`** — always. Node 20, `npm ci`, `npm test`. _Add a `npm run typecheck`
   step too_ (the prior its-a-rock scaffold ran typecheck in CI; keep that good
   habit — water-tracker doesn't but we should).
2. **`create-tag`** — `workflow_dispatch` only, `needs: test`. Resolves normal vs
   `-rerelease` mode, bumps `app.json` and commits `chore: bump app.json to
   <version>` to `main` (normal mode only), force-creates and pushes the
   `vX.Y.Z` tag. Identical logic to water-tracker's `create-tag` job.
3. **`build-release`** — `workflow_dispatch` only, `needs: create-tag`. Checks the
   release doesn't already exist, builds the signed APK, composes release notes
   from `changelogs/`, and publishes the Release **to this repo**.

> Copy the `run-name` expression from water-tracker so dispatch runs read
> `Release v0.1.0 — @actor` and push/PR runs read `CI — <ref>`.

### 8.3 Build & caching

Port these steps verbatim from water-tracker's `build-release` job:

- `actions/setup-node@v5` (Node 20, `cache: npm`) + `setup-java@v4` (temurin 17).
- **Expo prebuild cache** (`actions/cache@v4`) keyed on
  `hashFiles('package-lock.json', 'app.json', 'app.config.*', 'plugins/**')`,
  caching the generated `android/` dir; only run `npx expo prebuild
  --platform android --non-interactive` on a cache miss.
- `gradle/actions/setup-gradle@v4` with `build-root-directory: android`.
- After build, **trim `android/app/build`** from the cache (`if: always()`) so the
  prebuild cache stays lean — same as water-tracker.

### 8.4 Config plugins (`plugins/`)

Copy all four water-tracker plugins as-is — they encode hard-won Android build
fixes and the arm64-only speedup:

- `withAndroidCompileSdk.js` — pins compileSdk 36 / buildTools 35.0.0.
- `withAndroidMaterialPin.js` — forces `com.google.android.material:1.12.0`.
- `withGradleProperties.js` — gradle caching/parallel + `reactNativeArchitectures
  = arm64-v8a` (≈4× faster native builds).
- `withAndroidSigning.js` — injects a `release` signingConfig reading
  `KEYSTORE_PATH` / `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD` from env.

Register them in `app.json`'s `plugins` array (alongside `expo-router`,
`expo-sqlite`, `expo-image-picker`).

### 8.5 Signing & secrets

Generate a **new** release keystore for It's A Rock (do not reuse
water-tracker's). The workflow decodes it from a base64 secret at build time
(`KEYSTORE_BASE64`) and reads passwords from secrets. Repo secrets required:

| Secret | Purpose |
| ------ | ------- |
| `KEYSTORE_BASE64` | base64 of the release `.jks`/`.keystore` |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | signing key alias |
| `KEY_PASSWORD` | key password |

`RELEASE_REPO_TOKEN` is **not** used (same-repo publish via `GITHUB_TOKEN`).

`.gitignore` must exclude keystores/credentials (`*.jks`, `*.keystore`,
`*.credentials`, `*.p12`, `*.key`, etc.) — copy water-tracker's `.gitignore`.

### 8.6 Versioning, changelogs & release process

Identical model to water-tracker — see its `docs/releasing.md`, which `docs/releasing.md`
in this repo should be adapted from. Summary:

- Versions are `vMAJOR.MINOR.PATCH`. The leading `v` is for git tags + changelog
  filenames; `app.json` stores the bare number.
- **Never hand-edit `app.json`'s version** — the workflow bumps and commits it.
- One changelog per version at `changelogs/vX.Y.Z.md`, with a user-facing
  `## What's new` and an optional `## Under the hood` (everything from `## Under
  the hood` onward is **stripped** from published release notes).
- **Cut a release:** Actions → CI / Release → Run workflow → enter `vX.Y.Z` on
  `main`. The workflow tests, bumps `app.json`, tags, builds the signed APK,
  composes notes, and publishes the Release **to its-a-rock**.
- **Re-release:** run with `vX.Y.Z-rerelease` to rebuild from the existing tag
  and publish a separate `-rerelease` Release without touching `main`/the tag.

### 8.7 In-app updates

Port water-tracker's update mechanism, repointed at this repo:

- `src/utils/versionCompare.ts` — copy verbatim (`isNewerVersion`,
  `formatLastChecked`).
- `src/utils/updateChecker.ts` — adapt: `RELEASES_REPO =
  "rajwalgautam/its-a-rock"`, AsyncStorage key prefixes renamed (e.g.
  `@itsarock/...`). Keeps `performUpdateCheck`, `getLastCheckedAt`,
  `downloadAndInstallApk` (Android `IntentLauncher` install flow),
  `cleanupPendingApk`.
- `src/store/useUpdateStore.ts` — copy verbatim.
- `src/components/UpdateBanner.tsx` — copy, theme-aware.
- `app/_layout.tsx` — on boot: `initDatabase()`, load settings, run
  `cleanupPendingApk()` and `runStartupCheck()` (like water-tracker's root
  layout).
- Settings → About exposes manual "Check for Updates" + last-checked time.
- Android permissions in `app.json` for installing the APK
  (`REQUEST_INSTALL_PACKAGES`), matching water-tracker's permission list as
  applicable.

### 8.8 Local Pixel deploy

Adapt `scripts/deploy-pixel.sh` from water-tracker (ADB device detection, runs
tests, `expo prebuild`, `expo run:android [--variant release]`). Update the app
name in the log strings. Keep the `--release` flag for parity with CI builds.

---

## 9. Testing strategy (mirror water-tracker)

Follow water-tracker's `docs/testing.md` exactly. Two Jest projects in
`jest.config.js`:

| Project | Preset | Env | Tests | Notes |
| ------- | ------ | --- | ----- | ----- |
| `unit` | `ts-jest` | node | `**/__tests__/**/*.test.ts` | RN + expo natives mocked via `src/__mocks__/`. Fast. |
| `ui` | `jest-expo` | jsdom | `**/__tests__/**/*.test.tsx` | Real RN via React Native Testing Library. |

- Convention: **`.test.ts` → unit, `.test.tsx` → ui.**
- `npm test` runs both; CI runs `npm test` + `npm run typecheck`.
- Provide `src/__mocks__/` for `expo-sqlite`, `expo-haptics`,
  `async-storage`, `expo-router`, `expo-constants`, `expo-image-picker`, etc.,
  mirroring water-tracker's `src/__mocks__/`.
- Be aware of the **same known limitation** water-tracker documents: RN host
  components may render to a null stub under jest-expo ~55 + RN 0.83 (new arch),
  so a `ui` render test may need `describe.skip` until resolved. Keep the
  harness wired regardless.

**What to unit-test (the high-value pure logic):**
- `gradeUtils` — parse/format/compare `V4+`/`V4-`, ordering.
- `routeStats` — weekly visits, sends-this-week, active-project counts, week
  boundary math.
- `dateUtils` / `formatters` — date and label formatting.
- `validators` — RouteInput validation (optional fields, gym required).
- `versionCompare` — already covered by the water-tracker port's tests.

---

## 10. Work breakdown

Each item below is sized to become **one GitHub issue**. They're ordered so
dependencies come first. Use the AI-friendly issue format (Goal / Current state /
Proposed approach / Implementation steps / Acceptance criteria / Out of scope /
References) when expanding any item — the per-item notes here give you the Goal,
key decisions, and acceptance bar.

### Epic A — Project scaffold & conventions
1. **Scaffold the Expo app** — `app.json`, `package.json`, `tsconfig.json`,
   `babel.config.js` with the `@/` alias, `README.md`, `SECURITY.md`,
   `.gitignore` (copy water-tracker's). _Done when:_ `npm start` boots and
   `npm run typecheck` passes.
2. **Theme system + dark mode** — two palettes, `ThemeProvider`, `useTheme`,
   shared spacing/radius/fonts ([§5](#5-theming--dark-mode)). _Done when:_ a
   sample screen flips light↔dark live and the choice persists across restart.
3. **Jest two-project setup + mocks** — `jest.config.js`, `src/__mocks__/`
   ([§9](#9-testing-strategy-mirror-water-tracker)). _Done when:_ `npm test`
   runs `unit` + `ui` and passes with a trivial test in each.

### Epic B — Data layer
4. **SQLite schema + `database.ts`** — tables, indexes, WAL, `initDatabase`
   ([§4.1](#41-tables)). _Done when:_ DB initializes on boot without error.
5. **Types + query layer** — `src/types/index.ts`, `queries.ts` CRUD + gym
   upsert + range query ([§4.2](#42-typescript-types-srctypesindexts),
   [§4.3](#43-query-layer-srcdbqueriests)). _Done when:_ unit tests cover create/
   update/delete/get and gym dedupe.
6. **Stores** — `useRouteStore`, `useSettingsStore`, `useUpdateStore`
   ([§7](#7-state-management)). _Done when:_ store actions round-trip through
   the DB and settings persist.

### Epic C — Shared UI
7. **`RouteTile`** — photo fill, grade + location overlay, tap + long-press,
   density-aware sizing ([§6.5](#65-shared-the-tile-routetile)).
8. **`RouteGrid` + `ColumnDensityControl`** — FlatList grid, 2–4 columns from
   `useSettingsStore` ([§6.2](#62-my-climbing-apptabsindextsx)).
9. **`GradePicker`** — V-scale base + `+`/`-` modifier; backed by
   `gradeUtils` + `constants/grades.ts`.
10. **`PhotoPickerField`** — pick from library / take photo via
    `expo-image-picker`, store local URI + dimensions.
11. **`RouteForm`** — shared add/edit field set used by both the add screen and
    the card's edit mode.
12. **`RouteCard`** — reusable view/edit detail card with **persistent saves**
    ([§6.6](#66-shared-the-card-routecard--reusable-editable-persistent)).
    _Done when:_ edits save to SQLite and survive an app restart.
13. **`StatCard` + `FloatingAddButton`** — small stat tile + the `+` FAB with
    haptics.

### Epic D — Screens
14. **Tab layout** — 3 tabs, themed ([§6.1](#61-tab-layout-apptabs_layouttsx)).
15. **My Climbing tab** — weekly stats + projects grid + FAB + empty state
    ([§6.2](#62-my-climbing-apptabsindextsx)).
16. **History tab** — all-routes grid + density control
    ([§6.3](#63-history-apptabshistorytsx)).
17. **Settings tab** — appearance toggle + About/updates section
    ([§6.4](#64-settings-apptabssettingstsx)).
18. **Add + detail routes** — `app/routes/new.tsx`, `app/routes/[id].tsx`
    ([§6.6](#66-shared-the-card-routecard--reusable-editable-persistent),
    [§6.7](#67-add-climb-approutesnewtsx)).
19. **Weekly stats logic** — `routeStats.ts` (+ unit tests) feeding My Climbing
    ([§4.2](#42-typescript-types-srctypesindexts)).

### Epic E — Infrastructure
20. **Config plugins** — copy the four `plugins/*.js`, register in `app.json`
    ([§8.4](#84-config-plugins-plugins)).
21. **CI / Release workflow** — port `android-apk-release.yml`, **same-repo
    publish**, add typecheck to the test job
    ([§8.1](#81-the-one-big-difference-same-repo-releases)–[§8.3](#83-build--caching)).
    _Done when:_ push/PR runs tests+typecheck; a manual dispatch builds and
    publishes a signed APK Release to its-a-rock.
22. **Signing setup** — generate keystore, add the 4 repo secrets, verify
    `.gitignore` excludes credentials ([§8.5](#85-signing--secrets)).
23. **In-app updates** — port `versionCompare`, `updateChecker` (repointed),
    `useUpdateStore`, `UpdateBanner`; wire into root layout + Settings
    ([§8.7](#87-in-app-updates)).
24. **`scripts/deploy-pixel.sh`** — adapt local deploy script
    ([§8.8](#88-local-pixel-deploy)).
25. **Docs** — `docs/releasing.md` (adapted for same-repo target) and
    `docs/testing.md` (copied) ([§8.6](#86-versioning-changelogs--release-process)).

---

## 11. Out of scope (for now)

- No cloud sync, accounts, or backend.
- No iOS release pipeline (iOS may run in dev only).
- No backup/import-export (water-tracker has it; not required here unless a
  later issue adds it).
- No social/sharing features, no leaderboard, no route grading consensus.
- No Font-scale grading (V-scale + `+`/`-` only; revisit later if needed).

---

## 12. References

- **Sibling repo (canonical reference for everything):**
  `rajwalgautam/water-tracker` — read its `docs/releasing.md`,
  `docs/testing.md`, `.github/workflows/android-apk-release.yml`, `plugins/`,
  `src/store/`, `src/utils/updateChecker.ts`, and `app/(tabs)/`.
- Expo Router (file-based routing), `expo-sqlite` (sync API), `expo-image-picker`.
- `softprops/action-gh-release` (release publishing).
- React Native Testing Library (the `ui` Jest project).
</content>
</invoke>
