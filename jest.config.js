/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/client/jest.config.js',
    '<rootDir>/packages/core/jest.config.js',
    '<rootDir>/packages/ecs/jest.config.js',
    '<rootDir>/packages/physics-rapier/jest.config.js',
    '<rootDir>/packages/rendering-three/jest.config.js',
    '<rootDir>/packages/web-core/jest.config.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/']
};
