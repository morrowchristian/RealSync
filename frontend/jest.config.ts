import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // ts-jest compiles to ESM (useESM below), so Jest must load .ts/.tsx as ESM
  // — otherwise `import.meta.env` in axios.ts fails as "Cannot use
  // 'import.meta' outside a module".
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Only *.test.ts(x) files are test suites — setupTests.ts and polyfills.ts
  // live in __tests__/ too but contain no tests.
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.app.json',
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@/(.*)': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/__tests__/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
};

export default config;