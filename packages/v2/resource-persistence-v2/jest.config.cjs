/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/generated/'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  /** Resolve `@duckengine/core-v2` to TypeScript sources so Jest+Babel handle it (avoids parsing ESM `dist/`). */
  moduleNameMapper: {
    '^@duckengine/core-v2$': '<rootDir>/../core-v2/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 10000,
};
