/** @type {import('jest').Config} */
module.exports = {
  // Use babel-jest transform instead of ts-jest preset
  testEnvironment: 'jsdom',
  injectGlobals: true,
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/'],
  // Use babel-jest so we can transform ESM node_modules (preact, testing libs)
  transform: {
    // transform TS/JS and their JSX variants
    '^.+\\.[tj]sx?$': 'babel-jest',
    // transform ESM .mjs modules (some libs publish ESM only builds)
    '^.+\\.m?js$': 'babel-jest'
  },
  // Allow transforming certain ESM node_modules (preact and testing libs).
  // Keep node_modules ignored except for the listed packages which must be compiled.
  transformIgnorePatterns: [
    'node_modules/(?!(preact|@testing-library)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(.*)\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^@client/(.*)$': '<rootDir>/src/$1',
    // Let Babel transform real preact packages; no manual mock mapping required
    '^@testing-library/preact$': '<rootDir>/../../node_modules/@testing-library/preact/dist/cjs/index.js',
    '^@testing-library/preact/(.*)$': '<rootDir>/../../node_modules/@testing-library/preact/dist/cjs/$1',
  },
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/preload.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/jest.setup.js']
};
