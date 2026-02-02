/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  injectGlobals: true,
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.m?js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    // rapier3d-compat is ESM/WASM-ish; allow transforming it if needed.
    'node_modules/(?!(preact|@testing-library|@dimforge/rapier3d-compat)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@duckengine/ecs$': '<rootDir>/../ecs/src/index.ts',
    '^@duckengine/ecs/(.*)$': '<rootDir>/../ecs/src/$1',
    '^@duckengine/core$': '<rootDir>/../core/src/index.ts',
    '^@duckengine/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@duckengine/physics-rapier$': '<rootDir>/src/index.ts',
    '^@duckengine/physics-rapier/(.*)$': '<rootDir>/src/$1',
    '^@client/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  setupFiles: ['<rootDir>/jest.setup.js']
};
