/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  passWithNoTests: true,
  moduleNameMapper: {
    '^@duckengine/core-v2$': '<rootDir>/../core-v2/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testTimeout: 10000,
};
