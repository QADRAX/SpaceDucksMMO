/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^@duckengine/web-core-api-client$': '<rootDir>/src/__mocks__/web-core-api-client.ts',
  },
};
