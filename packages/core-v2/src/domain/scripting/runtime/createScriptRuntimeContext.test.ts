import { describe, it, expect } from '@jest/globals';
import { createEntity } from '../../entities';
import { createScene } from '../../scene';
import type { ScriptInstance } from '../schema';
import type { ScriptPermissions } from '../permissions';
import {
  createScriptRuntimeContext,
  createScriptRuntimeContextFromScriptInstance,
  createScriptRuntimeContextFromInstance,
} from './createScriptRuntimeContext';
import { createEntityId, createSceneId } from '../../ids';

describe('createScriptRuntimeContext', () => {
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

  it('composes self, scene, input and time APIs with explicit permissions', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const friendId = createEntityId('friend');
    const self = createEntity(selfId);
    const friend = createEntity(friendId);

    scene.entities.set(self.id, self);
    scene.entities.set(friend.id, friend);

    const context = createScriptRuntimeContext({
      scene,
      selfEntity: self,
      permissions: createPermissions({
        allowedEntityIds: new Set([friendId]),
        allowedPrefabIds: new Set(['duckPrefab']),
      }),
      context: {
        sceneApiContext: {
          instantiatePrefab: () => friendId,
        },
        inputApiContext: {
          isKeyPressed: (key) => key === 'W',
          getMousePosition: () => ({ x: 10, y: 20 }),
        },
        timeApiContext: {
          delta: 16,
          elapsed: 128,
          frameCount: 8,
          scale: 1,
        },
      },
    });

    expect(context.self.id).toBe(selfId);
    expect(context.scene.instantiate('duckPrefab')?.id).toBe(friendId);
    expect(context.input.isKeyPressed('W')).toBe(true);
    expect(context.input.getMousePosition()).toEqual({ x: 10, y: 20 });
    expect(context.time.deltaSeconds).toBeCloseTo(0.016);
  });

  it('derives permissions from script instance schema', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const friendId = createEntityId('friend');
    const hiddenId = createEntityId('hidden');
    const self = createEntity(selfId);
    const friend = createEntity(friendId);
    const hidden = createEntity(hiddenId);

    scene.entities.set(self.id, self);
    scene.entities.set(friend.id, friend);
    scene.entities.set(hidden.id, hidden);

    const instance: ScriptInstance = {
      schema: {
        name: 'FollowTarget',
        properties: {
          target: { type: 'entityRef' },
          spawner: { type: 'prefabRef' },
        },
      },
      properties: {
        target: friendId,
        spawner: 'duckPrefab',
      },
      enabled: true,
    };

    const context = createScriptRuntimeContextFromScriptInstance({
      scene,
      selfEntity: self,
      instance,
      context: {
        sceneApiContext: {
          findEntityIdsByTag: () => [friendId, hiddenId],
        },
      },
    });

    expect(context.permissions.allowedEntityIds.has(friendId)).toBe(true);
    expect(context.permissions.allowedPrefabIds.has('duckPrefab')).toBe(true);
    expect(context.scene.findByTag('any').map((entity) => entity.id)).toEqual([friendId]);
  });

  it('honors permissionOptions.canDestroySelf when deriving from instance', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    const instance: ScriptInstance = {
      schema: {
        name: 'SafeScript',
        properties: {},
      },
      properties: {},
      enabled: true,
    };

    const context = createScriptRuntimeContextFromInstance({
      scene,
      selfEntity: self,
      instance,
      permissionOptions: { canDestroySelf: false },
    });

    context.self.destroy();

    expect(scene.entities.has(selfId)).toBe(true);
  });

  it('keeps backward-compatible alias for fromInstance helper', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    const instance: ScriptInstance = {
      schema: {
        name: 'AliasCompat',
        properties: {},
      },
      properties: {},
      enabled: true,
    };

    const context = createScriptRuntimeContextFromInstance({
      scene,
      selfEntity: self,
      instance,
    });

    expect(context.self.id).toBe(selfId);
  });
});
