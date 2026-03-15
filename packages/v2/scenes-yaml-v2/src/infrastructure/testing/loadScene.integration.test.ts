import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEngine, createDuckEngineAPI, createSceneId } from '@duckengine/core-v2';
import { loadSceneFromYaml } from '../loadSceneFromYaml';

describe('Integration: loadSceneFromYaml', () => {
  beforeEach(() => {
    // Fresh engine per test
  });

  it('loads a simple scene with one entity', () => {
    const yaml = `
entities:
  - id: floor
    components:
      boxGeometry: { width: 10, height: 0.5, depth: 10 }
      standardMaterial: textures/floor
`;

    const engine = createEngine();
    const api = createDuckEngineAPI(engine);
    api.setup({});

    const sceneId = createSceneId('test');
    api.addScene({ sceneId });
    api.scene(sceneId).setupScene({});

    const result = loadSceneFromYaml(api, sceneId, yaml);
    expect(result.ok).toBe(true);

    const entities = api.scene(sceneId).listEntities();
    expect(entities.ok).toBe(true);
    if (entities.ok) {
      expect(entities.value.length).toBe(1);
      expect(entities.value[0].id).toBe('floor');
    }
  });

  it('loads scene with nested children', () => {
    const yaml = `
entities:
  - id: parent
    components:
      boxGeometry: {}
      name: { value: Parent }
    children:
      - id: child
        components:
          sphereGeometry: {}
          name: { value: Child }
`;

    const engine = createEngine();
    const api = createDuckEngineAPI(engine);
    api.setup({});

    const sceneId = createSceneId('test');
    api.addScene({ sceneId });
    api.scene(sceneId).setupScene({});

    const result = loadSceneFromYaml(api, sceneId, yaml);
    expect(result.ok).toBe(true);

    const entities = api.scene(sceneId).listEntities();
    expect(entities.ok).toBe(true);
    if (entities.ok) {
      expect(entities.value.length).toBe(1); // parent is root
      expect(entities.value[0].id).toBe('parent');
      const children = api.scene(sceneId).entity('parent').listChildren();
      expect(children.ok).toBe(true);
      if (children.ok) {
        expect(children.value.length).toBe(1);
        expect(children.value[0].id).toBe('child');
      }
    }
  });
});
