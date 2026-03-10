/**
 * Helpers for application-layer use case tests (reconcileSlots, runFrameHooks).
 */

import { createEntity, createComponent } from '@duckengine/core-v2';
import type { SceneState, SubsystemEventParams, SubsystemUpdateParams } from '@duckengine/core-v2';
import type { EntityId } from '@duckengine/core-v2';

/** Script ref shape for createMockScene. */
export interface MockScriptRef {
  scriptId: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

/**
 * Creates a minimal scene with one entity and a script component.
 * Use for testing reconcileSlots and runFrameHooks.
 */
export function createMockScene(
  entityId: EntityId,
  scripts: MockScriptRef[]
): SceneState {
  const entity = createEntity(entityId);
  entity.components.set('script', createComponent('script', { scripts }));
  return {
    entities: new Map([[entityId, entity]]),
  } as SceneState;
}

/** Builds SubsystemEventParams for a component-changed event. */
export function componentChangedEvent(
  scene: SceneState,
  entityId: EntityId,
  componentType: 'script' | 'name' = 'script'
): SubsystemEventParams {
  return {
    scene,
    event: { kind: 'component-changed', entityId, componentType },
  };
}

/** Params for runFrameHooks. */
export function updateParams(scene: SceneState, dt: number): SubsystemUpdateParams {
  return { scene, dt };
}
