import { describe, it, expect } from '@jest/globals';
import { createComponent } from '../../components';
import { addComponent, addChild, createEntity } from '../../entities';
import { createScene } from '../../scene';
import { buildEntityAPI } from './buildEntityAPI';
import { createEntityId, createSceneId } from '../../ids';

describe('buildEntityAPI', () => {

  it('allows writing self entity display name', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId, 'Self Name');
    scene.entities.set(self.id, self);

    const api = buildEntityAPI(self, scene, true, {});
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

    const api = buildEntityAPI(other, scene, false, {});
    api.name = 'Blocked';
    expect(other.displayName).toBe('Other Name');
  });

  // Note: canDestroySelf was previously a permission. Now it is simplified: if isSelf, you can destroy.
  // In a future step we might re-introduce a guard in buildEntityAPI but for now we follow the user's "no imposed permissions" rule.
  it('allows destroying self entity', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId, 'Self Name');
    scene.entities.set(self.id, self);

    const api = buildEntityAPI(self, scene, true, {});

    api.destroy();
    expect(scene.entities.has(selfId)).toBe(false);
  });

  it('allows access to all components because having EntityAPI is a capability', () => {
    const scene = createScene(createSceneId('scene'));
    const selfId = createEntityId('self');
    const self = createEntity(selfId);
    scene.entities.set(self.id, self);

    addComponent(self, createComponent('rigidBody'));
    addComponent(self, createComponent('name', { value: 'Duck' }));

    const api = buildEntityAPI(self, scene, true);

    expect(api.components.rigidBody).toBeDefined();
    expect(api.components.name).toBeDefined();
  });

  it('allows access to all sibling scripts', () => {
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

    const api = buildEntityAPI(self, scene, true);

    expect(api.scripts.MoveToPoint).toBeDefined();
    expect(api.scripts.WaypointPath).toBeDefined();
  });

  it('returns all children in transform.children', () => {
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

    const api = buildEntityAPI(self, scene, true);

    expect(api.transform.children.map((child) => child.id)).toContain(allowedId);
    expect(api.transform.children.map((child) => child.id)).toContain(hiddenId);
  });
});
