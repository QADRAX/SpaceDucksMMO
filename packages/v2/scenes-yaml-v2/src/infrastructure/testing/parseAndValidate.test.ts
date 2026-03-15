import { describe, it, expect } from '@jest/globals';
import { parseAndValidateSceneYaml } from '../loadSceneFromYaml';

describe('parseAndValidateSceneYaml', () => {
  it('validates a correct scene', () => {
    const yaml = `
entities:
  - id: floor
    components:
      boxGeometry: { width: 10, height: 0.5, depth: 10 }
      standardMaterial: textures/concrete-muddy
`;
    const result = parseAndValidateSceneYaml(yaml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entities).toHaveLength(1);
      expect(result.value.entities[0].id).toBe('floor');
    }
  });

  it('rejects invalid YAML', () => {
    const badYaml = `
entities:
  - id: e1
    components:
      boxGeometry: { width: "not-a-number"
`;
    const result = parseAndValidateSceneYaml(badYaml);
    expect(result.ok).toBe(false);
  });

  it('rejects invalid component field type', () => {
    const badYaml = `
entities:
  - id: e1
    components:
      boxGeometry: { width: "not-a-number" }
`;
    const result = parseAndValidateSceneYaml(badYaml);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('width');
    }
  });

  it('rejects unknown component type', () => {
    const badYaml = `
entities:
  - id: e1
    components:
      unknownComponent: {}
`;
    const result = parseAndValidateSceneYaml(badYaml);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('unknown');
    }
  });

  it('rejects duplicate entity ids', () => {
    const badYaml = `
entities:
  - id: same
    components: {}
  - id: same
    components: {}
`;
    const result = parseAndValidateSceneYaml(badYaml);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Duplicate');
    }
  });
});
