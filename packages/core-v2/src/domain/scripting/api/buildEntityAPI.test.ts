import { describe, it, expect } from '@jest/globals';
import { createComponent } from '../../components';
import { addComponent, addChild, createEntity } from '../../entities';
import { createScene } from '../../scene';
import type { ScriptPermissions } from '../permissions';
import { buildEntityAPI } from './buildEntityAPI';
import { createEntityId, createSceneId } from '../../ids';

describe('buildEntityAPI', () => {
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

  it('allows writing self entity display name', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId, 'Self Name');
    scene.entities.set(self.id, self);

    const api = buildEntityAPI(self, scene, createPermissions(), {});
    api.name = 'Updated';

    expect(self.displayName).toBe('Updated');
  });

  it('blocks writing external entity display name', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const otherId = createEntityId('other');
    const self = createEntity(selfId, 'Self Name');
    const other = createEntity(otherId, 'Other Name');
    scene.entities.set(self.id, self);
    scene.entities.set(other.id, other);

    const api = buildEntityAPI(other, scene, createPermissions(), {}, false);
    api.name = 'Blocked';
    expect(other.displayName).toBe('Other Name');
  });

  it('blocks destroying self when canDestroySelf is false', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId, 'Self Name');
    scene.entities.set(self.id, self);

    const api = buildEntityAPI(self, scene, createPermissions({ canDestroySelf: false }), {});

    api.destroy();
    expect(scene.entities.has(selfId)).toBe(true);
  });

  it('filters components by permission', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    addComponent(self, createComponent('rigidBody'));
    addComponent(self, createComponent('name', { value: 'Duck' }));

    const api = buildEntityAPI(
      self,
      scene,
      createPermissions({ allowedComponentTypes: new Set(['rigidBody']) }),
      {},
    );

    expect(api.components.rigidBody).toBeDefined();
    expect(api.components.name).toBeUndefined();
  });

  it('filters sibling scripts by permission', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    addComponent(
      self,
      createComponent('script', {
        scripts: [
          { scriptId: 'MoveToPoint', enabled: true, properties: { duration: 1 } },
          { scriptId: 'WaypointPath', enabled: true, properties: { loop: true } },
        ],
      }),
    );

    const api = buildEntityAPI(
      self,
      scene,
      createPermissions({ allowedScriptTypes: new Set(['MoveToPoint']) }),
      {},
    );

    expect(api.scripts.MoveToPoint).toBeDefined();
    expect(api.scripts.WaypointPath).toBeUndefined();
  });

  it('returns only allowed children in transform.children', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const allowedId = createEntityId('allowed');
    const hiddenId = createEntityId('hidden');
    const self = createEntity(selfId);
    const allowedChild = createEntity(allowedId);
    const hiddenChild = createEntity(hiddenId);

    addChild(self, allowedChild);
    addChild(self, hiddenChild);

    scene.entities.set(self.id, self);
    scene.entities.set(allowedChild.id, allowedChild);
    scene.entities.set(hiddenChild.id, hiddenChild);

    const api = buildEntityAPI(
      self,
      scene,
      createPermissions({ allowedEntityIds: new Set([allowedId]) }),
      {},
    );

    expect(api.transform.children.map((child) => child.id)).toEqual([allowedId]);
  });
});
