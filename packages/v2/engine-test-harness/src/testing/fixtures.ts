/**
 * Helpers for loading test fixtures.
 * In browser context, fixtures are served from public/ (e.g. /scenes/simple-floor.yaml).
 */

export const SIMPLE_FLOOR_YAML = `entities:
  - id: floor
    components:
      boxGeometry: { width: 10, height: 0.5, depth: 10 }
      standardMaterial: textures/floor
`;
