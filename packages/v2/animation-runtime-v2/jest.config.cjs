/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  passWithNoTests: true,
  /** Resolve core-v2 from TypeScript sources so Jest compiles one graph (workspace package is ESM in dist). */
  moduleNameMapper: {
    '^@duckengine/core-v2$': '<rootDir>/../core-v2/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testTimeout: 10000,
};
