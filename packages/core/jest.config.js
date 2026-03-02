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
    '^@client/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Performance tests need longer timeouts
  testTimeout: 30000,
  // Allow individual tests to override timeout
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
