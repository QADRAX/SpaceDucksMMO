/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/client/jest.config.js',
    '<rootDir>/packages/core/jest.config.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/']
};
