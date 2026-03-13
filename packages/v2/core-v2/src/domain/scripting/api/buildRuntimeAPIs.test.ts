import { describe, it, expect } from '@jest/globals';
import { createEntity } from '../../entities';
import { createScene } from '../../scene';
import { buildInputAPI } from './buildInputAPI';
import { buildSceneAPI } from './buildSceneAPI';
import { buildTimeAPI } from './buildTimeAPI';
import { createEntityId, createSceneId } from '../../ids';

describe('runtime scripting API builders', () => {
  it('returns null when instantiatePrefab is not provided', () => {
    const sceneId = createSceneId('scene');
    const scene = createScene(sceneId);
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    const api = buildSceneAPI(scene, {});

    const result = api.instantiate('blocked');

    expect(result).toBeNull();
  });

  it('uses findEntityIdsByTag when provided', () => {
    const sceneId = createSceneId('scene');
    const scene = createScene(sceneId);
    const allowedId = createEntityId('allowed');
    const hiddenId = createEntityId('hidden');
    const allowed = createEntity(allowedId);
    const hidden = createEntity(hiddenId);
    scene.entities.set(allowed.id, allowed);
    scene.entities.set(hidden.id, hidden);

    const api = buildSceneAPI(scene, {
      findEntityIdsByTag: () => [allowedId, hiddenId],
    });

    const entities = api.findByTag('duck');

    expect(entities.map((entity) => entity.id)).toEqual([allowedId, hiddenId]);
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
