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
    // three/webgpu and three/tsl ship as ESM-only and must be transformed by Babel.
    'node_modules/(?!(preact|@testing-library|three)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Redirect three/webgpu → three so factory tests get the standard THREE classes
    // (MeshStandardMaterial etc.) they assert against.
    // Tests that need the real WebGPU types (ThreeRenderer, ThreeMultiRenderer) 
    // override this with their own jest.mock('three/webgpu', …) which takes precedence.
    '^three/webgpu$': '<rootDir>/src/__mocks__/three-webgpu.js',
    '^three/tsl$': '<rootDir>/src/__mocks__/three-tsl.ts',
    '^@duckengine/core$': '<rootDir>/../core/src/index.ts',
    '^@duckengine/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@client/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  setupFiles: ['<rootDir>/jest.setup.js']
};
