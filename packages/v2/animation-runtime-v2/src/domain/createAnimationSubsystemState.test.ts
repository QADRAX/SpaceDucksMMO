import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createEntity,
  createEntityId,
  addComponent,
  setComponentEnabled,
} from '@duckengine/core-v2';
import { createComponent } from '@duckengine/core-v2';
import type { EntityState, SceneState } from '@duckengine/core-v2';
import {
  createAnimationSubsystemState,
  shouldTrackAnimatorEntity,
} from './createAnimationSubsystemState';

function makeSceneWithEntities(...entities: EntityState[]): SceneState {
  const map = new Map(entities.map((e) => [e.id, e] as const));
  return { entities: map } as unknown as SceneState;
}

describe('shouldTrackAnimatorEntity', () => {
  it('is false without animator', () => {
    const e = createEntity(createEntityId('e'));
    expect(shouldTrackAnimatorEntity(e)).toBe(false);
  });

  it('is false when animator disabled', () => {
    const e = createEntity(createEntityId('e'));
    addComponent(e, createComponent('animator'));
    setComponentEnabled(e, 'animator', false);
    expect(shouldTrackAnimatorEntity(e)).toBe(false);
  });

  it('is true when animator enabled', () => {
    const e = createEntity(createEntityId('e'));
    addComponent(e, createComponent('animator'));
    expect(shouldTrackAnimatorEntity(e)).toBe(true);
  });
});

describe('createAnimationSubsystemState', () => {
  const getAnimationClipData = (): null => null;

  let state: ReturnType<typeof createAnimationSubsystemState>;

  beforeEach(() => {
    state = createAnimationSubsystemState({ getAnimationClipData });
  });

  it('syncAnimatorForEntity adds and removes ids', () => {
    const e = createEntity(createEntityId('anim'));
    addComponent(e, createComponent('animator'));
    state.syncAnimatorForEntity(e);
    expect(state.animatedEntityIds.has(e.id)).toBe(true);

    setComponentEnabled(e, 'animator', false);
    state.syncAnimatorForEntity(e);
    expect(state.animatedEntityIds.has(e.id)).toBe(false);
  });

  it('reconcileAnimatorsInScene syncs all entities in the map', () => {
    const a = createEntity(createEntityId('a'));
    addComponent(a, createComponent('animator'));
    const b = createEntity(createEntityId('b'));
    addComponent(b, createComponent('animator'));
    setComponentEnabled(b, 'animator', false);

    const scene = makeSceneWithEntities(a, b);
    state.reconcileAnimatorsInScene(scene);

    expect(state.animatedEntityIds.has(a.id)).toBe(true);
    expect(state.animatedEntityIds.has(b.id)).toBe(false);
  });

  it('removeAnimatorEntity drops an id', () => {
    const e = createEntity(createEntityId('x'));
    addComponent(e, createComponent('animator'));
    state.syncAnimatorForEntity(e);
    state.removeAnimatorEntity(e.id);
    expect(state.animatedEntityIds.has(e.id)).toBe(false);
  });

  it('clearAnimatedEntities empties the registry', () => {
    const e = createEntity(createEntityId('y'));
    addComponent(e, createComponent('animator'));
    state.syncAnimatorForEntity(e);
    state.clearAnimatedEntities();
    expect(state.animatedEntityIds.size).toBe(0);
  });
});
