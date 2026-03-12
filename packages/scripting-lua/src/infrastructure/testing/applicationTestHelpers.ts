/**
 * Helpers for application-layer use case tests (reconcileSlots, frame hooks).
 */

import { createEntity, createComponent, createSceneEventBus } from '@duckengine/core-v2';
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
 * Use for testing reconcileSlots and frame hook phases.
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

/** Params for frame hook phase use cases. */
export function updateParams(scene: SceneState, dt: number): SubsystemUpdateParams {
  return { scene, dt };
}

import type { ScriptSandbox } from '../../domain/ports';
import type { ScriptingSessionState } from '../../domain/session';

/** Mock ScriptSandbox for frame hook phase tests. */
export function createMockSandbox(overrides?: Partial<ScriptSandbox>) {
  return {
    detectHooks: jest.fn(),
    createSlot: jest.fn(),
    destroySlot: jest.fn(),
    callHook: jest.fn().mockReturnValue(true),
    syncProperties: jest.fn(),
    flushDirtyProperties: jest.fn().mockReturnValue(null),
    dispose: jest.fn(),
    bindComponentAccessors: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<ScriptSandbox>;
}

/** Minimal ScriptingSessionState for frame hook phase tests. */
export function createMockSession(
  sandbox: ReturnType<typeof createMockSandbox>,
  overrides?: Partial<ScriptingSessionState>
): ScriptingSessionState {
  return {
    slots: new Map(),
    pending: new Map(),
    eventBus: createSceneEventBus(),
    timeState: { delta: 0, elapsed: 0, frameCount: 0, scale: 1 },
    sandbox,
    bridges: [],
    ports: {},
    resolveSource: jest.fn().mockResolvedValue(null),
    resolveScriptSchema: jest.fn().mockResolvedValue(null),
    pendingDestroys: [],
    ...overrides,
  } as ScriptingSessionState;
}

/** Builds SubsystemEventParams for an entity-removed event. */
export function entityRemovedEvent(scene: SceneState, entityId: EntityId): SubsystemEventParams {
  return {
    scene,
    event: { kind: 'entity-removed', entityId },
  };
}
