/**
 * Mock for @duckengine/web-core-api-client (ESM-only package).
 * Prevents Jest from loading the real ESM module which causes SyntaxError.
 */
export const EngineService = {
  getApiEngineResourcesResolve: jest.fn(),
};
