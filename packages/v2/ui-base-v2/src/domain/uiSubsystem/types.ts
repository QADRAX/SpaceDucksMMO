import type {
  EntityId,
  SceneId,
  UICustomRuntimePort,
  UISurfaceHostPort,
  UIViewRuntimePort,
  ViewportId,
} from '@duckengine/core-v2';

/** Key for a mounted UI root on one viewport. */
export type UIMountKey = `${EntityId}::${ViewportId}`;

/** Builds a stable mount key. */
export function uiMountKey(entityId: EntityId, viewportId: ViewportId): UIMountKey {
  return `${entityId}::${viewportId}`;
}

/**
 * Mutable state for the shared UI projection subsystem.
 * Resolves surfaces/targets and **delegates** paint to Duck (`viewRuntime`) or custom (`customRuntime`).
 */
export interface UISubsystemState {
  readonly sceneId: SceneId;
  readonly surfaceHost: UISurfaceHostPort | undefined;
  readonly viewRuntime: UIViewRuntimePort | undefined;
  readonly customRuntime: UICustomRuntimePort | undefined;
  /**
   * Optional tag lookup for `uiTarget.cameraTags`.
   * When omitted, cameraTags filters never match.
   */
  readonly cameraHasTag?: (cameraEntityId: EntityId, tag: string) => boolean;
  /** Currently mounted (entity, viewport) pairs. */
  readonly mounted: Set<UIMountKey>;
}
