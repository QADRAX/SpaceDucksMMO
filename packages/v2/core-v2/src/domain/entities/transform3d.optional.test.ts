import { describe, it, expect } from '@jest/globals';
import { createEntity, createSpatialEntity, addComponent, addChild } from './entity';
import { getTransform3d } from './transform3dAccess';
import { createComponent } from '../components';
import { createEntityId } from '../ids';
import { ensureClean } from './transform';

describe('optional transform3d', () => {
  it('createEntity has no transform3d', () => {
    const e = createEntity(createEntityId('bare'));
    expect(getTransform3d(e)).toBeUndefined();
  });

  it('createSpatialEntity has transform3d', () => {
    const e = createSpatialEntity(createEntityId('spatial'));
    expect(getTransform3d(e)).toBeDefined();
  });

  it('gravity can be added without transform3d', () => {
    const e = createEntity(createEntityId('g'));
    const r = addComponent(e, createComponent('gravity'));
    expect(r.ok).toBe(true);
    expect(getTransform3d(e)).toBeUndefined();
  });

  it('ambientLight can be added without transform3d', () => {
    const e = createEntity(createEntityId('a'));
    const r = addComponent(e, createComponent('ambientLight'));
    expect(r.ok).toBe(true);
  });

  it('cameraPerspective requires transform3d', () => {
    const e = createEntity(createEntityId('cam'));
    const r = addComponent(e, createComponent('cameraPerspective'));
    expect(r.ok).toBe(false);
  });

  it('child with transform3d under parent without pose uses local as world', () => {
    const folder = createEntity(createEntityId('folder'));
    const child = createSpatialEntity(createEntityId('child'), undefined, {
      position: { x: 1, y: 2, z: 3 },
    });
    addChild(folder, child);
    const state = getTransform3d(child)!;
    expect(state.parent).toBeUndefined();
    ensureClean(state);
    expect(state.worldPosition).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('child pose parent links to nearest ancestor with transform3d', () => {
    const root = createSpatialEntity(createEntityId('root'));
    const mid = createEntity(createEntityId('mid'));
    const leaf = createSpatialEntity(createEntityId('leaf'));
    addChild(root, mid);
    addChild(mid, leaf);
    expect(getTransform3d(leaf)!.parent).toBe(getTransform3d(root));
  });
});
