import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEntity, createEntityId, addComponent } from '@duckengine/core-v2';
import { createComponent } from '@duckengine/core-v2';
import type { SceneState } from '@duckengine/core-v2';
import { createAnimationSubsystemState } from '../domain/createAnimationSubsystemState';
import {
  onEntityAddedAnimation,
  onEntityRemovedAnimation,
  onComponentChangedAnimation,
  onSceneSetupAnimation,
  onSceneTeardownAnimation,
} from './animationRegistryEvents';

function sceneWith(entity: ReturnType<typeof createEntity>): SceneState {
  return {
    entities: new Map([[entity.id, entity]]),
  } as unknown as SceneState;
}

describe('animation registry scene events', () => {
  const getAnimationClipData = (): null => null;
  let state: ReturnType<typeof createAnimationSubsystemState>;

  beforeEach(() => {
    state = createAnimationSubsystemState({ getAnimationClipData });
  });

  it('onEntityAddedAnimation registers an enabled animator', () => {
    const e = createEntity(createEntityId('e1'));
    addComponent(e, createComponent('animator'));
    const scene = sceneWith(e);

    onEntityAddedAnimation.execute(state, {
      scene,
      event: { kind: 'entity-added', entityId: e.id },
    });

    expect(state.animatedEntityIds.has(e.id)).toBe(true);
  });

  it('onEntityRemovedAnimation removes the id', () => {
    const id = createEntityId('gone');
    state.syncAnimatorForEntity(
      (() => {
        const e = createEntity(id);
        addComponent(e, createComponent('animator'));
        return e;
      })(),
    );

    onEntityRemovedAnimation.execute(state, {
      scene: { entities: new Map() } as unknown as SceneState,
      event: { kind: 'entity-removed', entityId: id },
    });

    expect(state.animatedEntityIds.has(id)).toBe(false);
  });

  it('onComponentChangedAnimation ignores non-animator types', () => {
    const e = createEntity(createEntityId('mesh'));
    const scene = sceneWith(e);

    onComponentChangedAnimation.execute(state, {
      scene,
      event: { kind: 'component-changed', entityId: e.id, componentType: 'joint' },
    });

    expect(state.animatedEntityIds.size).toBe(0);
  });

  it('onSceneSetupAnimation reconciles the whole scene map', () => {
    const a = createEntity(createEntityId('sa'));
    addComponent(a, createComponent('animator'));
    const scene = { entities: new Map([[a.id, a]]) } as unknown as SceneState;

    onSceneSetupAnimation.execute(state, {
      scene,
      event: { kind: 'scene-setup' },
    });

    expect(state.animatedEntityIds.has(a.id)).toBe(true);
  });

  it('onSceneTeardownAnimation clears the registry', () => {
    const e = createEntity(createEntityId('td'));
    addComponent(e, createComponent('animator'));
    state.syncAnimatorForEntity(e);

    onSceneTeardownAnimation.execute(state, {
      scene: sceneWith(e),
      event: { kind: 'scene-teardown' },
    });

    expect(state.animatedEntityIds.size).toBe(0);
  });
});
