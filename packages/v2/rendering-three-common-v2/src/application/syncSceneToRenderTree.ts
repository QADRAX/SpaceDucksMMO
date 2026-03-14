import type { SceneState } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../domain';

/**
 * Syncs a scene's ECS entities to the Three.js render tree using the given features.
 * Call each frame from preRender (engine subsystem state).
 */
export function syncSceneToRenderTree(
  scene: SceneState,
  context: RenderContextThree,
  features: ReadonlyArray<RenderFeature>,
): void {
  const attachedIds = new Set<string>();

  for (const [entityId, entity] of scene.entities) {
    attachedIds.add(entityId);
    const root = context.registry.get(entityId);
    const wasAttached = root !== undefined;

    for (const feature of features) {
      const eligible = feature.isEligible(entity, scene);
      if (eligible && !wasAttached) {
        feature.onAttach(entity, context);
      } else if (eligible && wasAttached) {
        feature.onTransformChanged?.(entity, context);
      } else if (!eligible) {
        feature.onDetach(entity, context);
      }
    }
  }

  for (const entityId of context.registry.keys()) {
    if (!attachedIds.has(entityId)) {
      for (const feature of features) {
        if (feature.onDetachById) {
          feature.onDetachById(entityId, context);
        }
      }
    }
  }
}
