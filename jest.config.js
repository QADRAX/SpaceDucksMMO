/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/client/jest.config.js',
    '<rootDir>/packages/v1/core/jest.config.js',
    '<rootDir>/packages/ecs/jest.config.js',
    '<rootDir>/packages/v1/physics-rapier/jest.config.js',
    '<rootDir>/packages/v1/rendering-three/jest.config.js',
    '<rootDir>/packages/v1/web-core/jest.config.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/']
};
