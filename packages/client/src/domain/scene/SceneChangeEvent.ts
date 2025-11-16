import type { Entity } from '../ecs/core/Entity';

export type SceneChangeEvent =
  | { kind: 'entity-added'; entity: Entity }
  | { kind: 'entity-removed'; entityId: string }
  | { kind: 'hierarchy-changed'; childId: string; newParentId: string | null }
  | { kind: 'transform-changed'; entityId: string }
  | { kind: 'component-changed'; entityId: string; componentType: string };

export default SceneChangeEvent;
