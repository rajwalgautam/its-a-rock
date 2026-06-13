# It's A Rock

An offline-first Android app for tracking bouldering progress across multiple
gyms. Photograph a boulder problem ("route"), tag it with a grade and the gym
it's at, and track whether you've sent it or are still projecting it.

There is **no account, no backend, and no network dependency** for core use.
All data lives in on-device SQLite. The only network call is the optional
in-app update check.

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for the full design and the work
breakdown.

## Tech stack

- **Expo** (SDK ~55), **React Native** 0.83.x, new architecture
- **TypeScript** ~5.9 (`strict`)
- **expo-router** (file-based navigation, typed routes)
- **zustand** for state, **expo-sqlite** (sync API, WAL) for persistence
- **@react-native-async-storage/async-storage** for local prefs
- **expo-image-picker** for climb photos
- Light/dark theme with a user-controlled toggle

## Getting started

```sh
npm install
npm start          # launch the Expo dev server
npm run android    # build & run on a connected Android device/emulator
```

## Quality

```sh
npm run typecheck  # tsc --noEmit
npm test           # Jest: unit (ts-jest/node) + ui (jest-expo/jsdom)
```

Convention: `*.test.ts` → `unit` project, `*.test.tsx` → `ui` project.

## Project layout

```
app/          expo-router routes (tabs + route detail/new)
src/
  components/ shared UI
  constants/  theme palettes, grades
  db/         SQLite database + query layer
  store/      zustand stores
  theme/      ThemeProvider + useTheme
  types/      shared TypeScript types
  utils/      pure logic (grades, stats, dates, validators)
```

## License

Personal project; not currently licensed for redistribution.
