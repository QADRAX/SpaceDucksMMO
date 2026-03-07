import type { EntityState } from '../ecs/entity';
import type { DebugKind } from './debug';
import type { SceneChangeEventWithError } from './sceneEvents';
import type { RenderSyncPort } from '../ports/renderSyncPort';
import type { PhysicsPort } from '../ports/physicsPort';
import type { GizmoPort } from '../ports/gizmoPort';

/** External system ports that can be injected into a scene. */
export interface ScenePorts {
  renderSync?: RenderSyncPort;
  physics?: PhysicsPort;
  gizmo?: GizmoPort;
}

/**
 * Mutable scene state operated on by application-layer use cases.
 * Created by `createScene`, mutated by use-case functions.
 */
export interface SceneState {
  readonly id: string;
  readonly entities: Map<string, EntityState>;
  readonly rootEntityIds: string[];
  activeCameraId: string | null;
  readonly debugFlags: Map<DebugKind, boolean>;
  readonly changeListeners: Set<(ev: SceneChangeEventWithError) => void>;
  /** Cleanup functions for detaching entity observers, keyed by entity id. */
  readonly entityCleanups: Map<string, () => void>;
  /** Injected system ports (mutable so they can be set during setup). */
  ports: ScenePorts;
}
