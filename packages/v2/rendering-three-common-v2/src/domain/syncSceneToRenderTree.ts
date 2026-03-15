import type { SceneState } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from './renderContextThree';

/** Reused each frame to avoid allocation in syncSceneToRenderTree. */
const attachedIds = new Set<string>();

/**
 * Syncs a scene's ECS entities to the Three.js render tree using the given features.
 * Call each frame from preRender. Each feature is called once per entity (syncEntity);
 * it resolves the component once and branches internally (attach / update / detach).
 */
export function syncSceneToRenderTree(
  scene: SceneState,
  context: RenderContextThree,
  features: ReadonlyArray<RenderFeature<RenderContextThree>>,
): void {
  attachedIds.clear();

  for (const [entityId, entity] of scene.entities) {
    attachedIds.add(entityId);
    for (const feature of features) {
      feature.syncEntity(entity, context);
    }
  }

  for (const entityId of context.registry.keys()) {
    if (!attachedIds.has(entityId)) {
      for (const feature of features) {
        feature.onDetachById?.(entityId, context);
      }
    }
  }
}
