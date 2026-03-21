import type { SubsystemEventParams } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { AnimationSubsystemState } from '../domain/createAnimationSubsystemState';

/** When an entity is added, register if it carries an enabled animator. */
export const onEntityAddedAnimation = defineSubsystemEventUseCase<
  AnimationSubsystemState,
  SubsystemEventParams,
  void
>({
  name: 'animation/onEntityAdded',
  event: 'entity-added',
  execute(state, params) {
    if (params.event.kind !== 'entity-added') return;
    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;
    state.syncAnimatorForEntity(entity);
  },
});

/** Drop registry entry when an entity leaves the scene (fires once per removed node). */
export const onEntityRemovedAnimation = defineSubsystemEventUseCase<
  AnimationSubsystemState,
  SubsystemEventParams,
  void
>({
  name: 'animation/onEntityRemoved',
  event: 'entity-removed',
  execute(state, params) {
    if (params.event.kind !== 'entity-removed') return;
    state.removeAnimatorEntity(params.event.entityId);
  },
});

/** Track enable/disable and clip list changes for the animator component. */
export const onComponentChangedAnimation = defineSubsystemEventUseCase<
  AnimationSubsystemState,
  SubsystemEventParams,
  void
>({
  name: 'animation/onComponentChanged',
  event: 'component-changed',
  execute(state, params) {
    if (params.event.kind !== 'component-changed') return;
    if (params.event.componentType !== 'animator') return;
    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;
    state.syncAnimatorForEntity(entity);
  },
});

/**
 * One full pass after scene setup — safety net if ordering ever skips events, and cheap vs
 * scanning every frame.
 */
export const onSceneSetupAnimation = defineSubsystemEventUseCase<
  AnimationSubsystemState,
  SubsystemEventParams,
  void
>({
  name: 'animation/onSceneSetup',
  event: 'scene-setup',
  execute(state, params) {
    if (params.event.kind !== 'scene-setup') return;
    state.reconcileAnimatorsInScene(params.scene);
  },
});

export const onSceneTeardownAnimation = defineSubsystemEventUseCase<
  AnimationSubsystemState,
  SubsystemEventParams,
  void
>({
  name: 'animation/onSceneTeardown',
  event: 'scene-teardown',
  execute(state, params) {
    if (params.event.kind !== 'scene-teardown') return;
    state.clearAnimatedEntities();
  },
});
