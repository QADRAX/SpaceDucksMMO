import type { Entity } from '../ecs/core/Entity';

export type SceneChangeEvent =
  | { kind: 'entity-added'; entity: Entity }
  | { kind: 'entity-removed'; entityId: string }
  | { kind: 'hierarchy-changed'; childId: string; newParentId: string | null }
  | { kind: 'active-camera-changed'; entityId: string | null }
  | { kind: 'transform-changed'; entityId: string }
  | { kind: 'component-changed'; entityId: string; componentType: string }
  | { kind: 'scene-debug-changed'; enabled: boolean };

// Generic error event to notify UI/inspector about invalid operations or problems
export type SceneChangeErrorEvent = { kind: 'error'; message: string };

export type SceneChangeEventWithError = SceneChangeEvent | SceneChangeErrorEvent;
export default SceneChangeEventWithError;
