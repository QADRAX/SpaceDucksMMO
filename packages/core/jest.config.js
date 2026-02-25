/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  injectGlobals: true,
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.m?js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(preact|@testing-library)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@duckengine/ecs$': '<rootDir>/../ecs/src/index.ts',
    '^@duckengine/ecs/(.*)$': '<rootDir>/../ecs/src/$1',
    '^@client/domain/ecs/(.*)$': '<rootDir>/../ecs/src/domain/ecs/$1',
    '^@client/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  setupFiles: ['<rootDir>/jest.setup.js']
};
