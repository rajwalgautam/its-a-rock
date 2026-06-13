# Testing

Tests run under Jest, split into two [projects](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig)
configured in [`jest.config.js`](../jest.config.js). `npm test` runs both; output
is labeled `unit` and `ui`.

| Project | Preset | Environment | Tests | React Native |
| ------- | ------ | ----------- | ----- | ------------ |
| `unit` | `ts-jest` | node | `**/__tests__/**/*.test.ts` | mocked (`src/__mocks__/`), fast |
| `ui` | `jest-expo` | jsdom | `**/__tests__/**/*.test.tsx` | real, via React Native Testing Library |

## Convention: pick the project by file extension

- **`*.test.ts` → `unit`.** Pure logic (utils, stores, query builders). React
  Native is fully stubbed, so these are fast and can't render components.
- **`*.test.tsx` → `ui`.** Component/render tests using
  [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
  (`render`, `fireEvent`, queries). Real React Native via `jest-expo`.

Note: RNTL 14's `render` and `fireEvent` are **async** — `await` them.

## Running

```sh
npm test                      # both projects
npx jest --selectProjects unit
npx jest --selectProjects ui
npx jest path/to/file.test.ts # a single file
```

## Known limitation: `ui` rendering is currently blocked

The `ui` harness is wired up, but React Native host components (`View`, `Text`,
`Image`) currently render to a null stub under jest-expo ~55 + React Native 0.83
(new architecture), so RNTL queries find nothing. The template test
[`__tests__/harness.test.tsx`](../__tests__/harness.test.tsx) keeps a render
smoke test `.skip`-ped for this reason; un-skip it once that's resolved. `unit`
tests are unaffected, which is where all of the high-value pure logic
(`gradeUtils`, `routeStats`, `validators`, `gymUtils`, `versionCompare`,
`settingsStorage`) is covered.
