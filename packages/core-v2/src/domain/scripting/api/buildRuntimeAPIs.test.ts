import { describe, it, expect, jest } from '@jest/globals';
import { createEntity } from '../../entities';
import { createScene } from '../../scene';
import type { ScriptPermissions } from '../permissions';
import { buildInputAPI } from './buildInputAPI';
import { buildSceneAPI } from './buildSceneAPI';
import { buildTimeAPI } from './buildTimeAPI';
import { createEntityId, createSceneId } from '../../ids';

describe('runtime scripting API builders', () => {
  function createPermissions(overrides: Partial<ScriptPermissions> = {}): ScriptPermissions {
    return {
      selfEntityId: createEntityId('self'),
      allowedEntityIds: new Set(),
      allowedScriptTypes: new Set<string>(),
      allowedComponentTypes: new Set(),
      allowedPrefabIds: new Set<string>(),
      canDestroySelf: true,
      ...overrides,
    };
  }

  it('blocks instantiate when prefab is not allowed', () => {
    const sceneId = createSceneId('scene');
    const scene = createScene(sceneId);
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    const instantiatePrefab = jest.fn(() => createEntityId('spawned'));

    const api = buildSceneAPI(
      scene,
      createPermissions({ allowedPrefabIds: new Set(['allowed']) }),
      { instantiatePrefab },
    );

    const result = api.instantiate('blocked');

    expect(result).toBeNull();
    expect(instantiatePrefab).not.toHaveBeenCalled();
  });

  it('filters findByTag results by entity permissions', () => {
    const sceneId = createSceneId('scene');
    const scene = createScene(sceneId);
    const allowedId = createEntityId('allowed');
    const hiddenId = createEntityId('hidden');
    const allowed = createEntity(allowedId);
    const hidden = createEntity(hiddenId);
    scene.entities.set(allowed.id, allowed);
    scene.entities.set(hidden.id, hidden);

    const api = buildSceneAPI(
      scene,
      createPermissions({ allowedEntityIds: new Set([allowedId]) }),
      {
        findEntityIdsByTag: () => [allowedId, hiddenId],
      },
    );

    const entities = api.findByTag('duck');

    expect(entities.map((entity) => entity.id)).toEqual([allowedId]);
  });

  it('returns default values when input callbacks are missing', () => {
    const input = buildInputAPI({});

    expect(input.isKeyPressed('Space')).toBe(false);
    expect(input.getMousePosition()).toEqual({ x: 0, y: 0 });
    expect(input.getMouseDelta()).toEqual({ x: 0, y: 0 });
  });

  it('derives deltaSeconds from millisecond delta', () => {
    const time = buildTimeAPI({ delta: 32, elapsed: 1000, frameCount: 50, scale: 1 });

    expect(time.delta).toBe(32);
    expect(time.deltaSeconds).toBeCloseTo(0.032);
    expect(time.elapsed).toBe(1000);
    expect(time.frameCount).toBe(50);
    expect(time.scale).toBe(1);
  });
});
