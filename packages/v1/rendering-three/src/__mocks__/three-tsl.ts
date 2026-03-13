// Minimal stub for three/tsl used in test environments.
// In production, three/tsl provides shader node utilities for WebGPU.
// For tests that don't exercise WebGPU shader graphs, a no-op is sufficient.
export const pass = jest.fn().mockReturnValue({ camera: null });
