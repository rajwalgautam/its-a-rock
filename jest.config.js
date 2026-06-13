// Two Jest projects:
//   unit — pure TS logic, ts-jest + node, react-native fully mocked. Fast.
//   ui   — React component/render tests, jest-expo + jsdom, real react-native
//          via RNTL. Convention: `.test.ts` -> unit, `.test.tsx` -> ui.
// Run one project with: jest --selectProjects unit  (or ui).

/** Shared @/ alias + expo native-module mocks (no react-native mock here). */
const sharedModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^expo-sqlite$': '<rootDir>/src/__mocks__/expo-sqlite.ts',
  '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.ts',
  '^expo-image-picker$': '<rootDir>/src/__mocks__/expo-image-picker.ts',
  '^@react-native-async-storage/async-storage$':
    '<rootDir>/src/__mocks__/async-storage.ts',
};

const unit = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          strict: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    ...sharedModuleNameMapper,
    '^expo-router$': '<rootDir>/src/__mocks__/expo-router.ts',
    '^expo-status-bar$': '<rootDir>/src/__mocks__/expo-status-bar.ts',
    '^expo-constants$': '<rootDir>/src/__mocks__/expo-constants.ts',
    '^expo$': '<rootDir>/src/__mocks__/expo.ts',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

const ui = {
  displayName: 'ui',
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.tsx'],
  // RNTL 14 auto-extends expect with its built-in matchers on import, so no
  // extend-expect setup is needed. Real react-native (via jest-expo); only the
  // native modules are mocked.
  moduleNameMapper: sharedModuleNameMapper,
};

module.exports = {
  projects: [unit, ui],
};
