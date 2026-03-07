import type { EntityState } from '../ecs/entity';
import type { DebugKind } from './debug';
import type { SceneChangeListener, SceneSystemAdapter } from './sceneSystemAdapter';

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
  readonly changeListeners: Set<SceneChangeListener>;
  /** Cleanup functions for detaching entity observers, keyed by entity id. */
  readonly entityCleanups: Map<string, () => void>;
  /** Registered adapters in update-pipeline order. */
  readonly adapters: SceneSystemAdapter[];
}
