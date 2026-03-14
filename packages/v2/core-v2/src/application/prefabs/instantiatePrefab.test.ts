import { createEngine } from '../../domain/engine';
import { addSceneToEngine } from '../engine/addSceneToEngine';
import { setupEngine } from '../engine/setupEngine';
import { createSceneId, createEntityId, createPrefabId } from '../../domain/ids';
import { createEntity } from '../../domain/entities';
import { addPrefab } from './addPrefab';
import { instantiatePrefab } from './instantiatePrefab';

function getScene() {
  const engine = createEngine();
  setupEngine.execute(engine, {});
  addSceneToEngine.execute(engine, { sceneId: createSceneId('main') });
  return engine.scenes.get(createSceneId('main'))!;
}

describe('instantiatePrefab', () => {
  it('returns not-found when prefab does not exist', () => {
    const scene = getScene();
    const result = instantiatePrefab.execute(scene, {
      prefabId: createPrefabId('non-existent'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not-found');
      expect(result.error.message).toContain('non-existent');
    }
  });

  it('instantiates prefab and adds entity to scene', () => {
    const scene = getScene();
    const template = createEntity(createEntityId('bullet-template'), 'Bullet');
    addPrefab.execute(scene, { prefabId: createPrefabId('bullet'), entity: template });

    const result = instantiatePrefab.execute(scene, {
      prefabId: createPrefabId('bullet'),
      position: { x: 1, y: 2, z: 3 },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const entityId = result.value;
      expect(scene.entities.has(entityId)).toBe(true);
      const entity = scene.entities.get(entityId)!;
      expect(entity.displayName).toBe('Bullet');
      expect(entity.transform.localPosition.x).toBe(1);
      expect(entity.transform.localPosition.y).toBe(2);
      expect(entity.transform.localPosition.z).toBe(3);
      expect(entity.id).not.toBe(createEntityId('bullet-template'));
    }
  });

  it('applies rotation when provided', () => {
    const scene = getScene();
    const template = createEntity(createEntityId('t'));
    addPrefab.execute(scene, { prefabId: createPrefabId('p'), entity: template });

    const result = instantiatePrefab.execute(scene, {
      prefabId: createPrefabId('p'),
      rotation: { x: 0, y: Math.PI / 2, z: 0 },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const entity = scene.entities.get(result.value)!;
      expect(entity.transform.localRotation.y).toBeCloseTo(Math.PI / 2);
    }
  });
});
