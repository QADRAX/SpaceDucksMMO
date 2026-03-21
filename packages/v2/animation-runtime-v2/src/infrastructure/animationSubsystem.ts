import { createSceneSubsystem, ResourceCachePortDef } from '@duckengine/core-v2';
import type { AnimationSubsystemState } from '../domain/createAnimationSubsystemState';
import { createAnimationSubsystemState } from '../domain/createAnimationSubsystemState';
import { animationTick } from '../application/animationTick';
import {
  onEntityAddedAnimation,
  onEntityRemovedAnimation,
  onComponentChangedAnimation,
  onSceneSetupAnimation,
  onSceneTeardownAnimation,
} from '../application/animationRegistryEvents';

/**
 * Scene subsystem: animation playback (earlyUpdate — before physics and scripting).
 * Resolves clips via {@link ResourceCachePortDef.getAnimationClipData}.
 *
 * **Registry**: entities with an enabled `animator` are tracked via `entity-added`,
 * `entity-removed`, `component-changed` (animator), plus a full `scene-setup` reconcile.
 * `earlyUpdate` only iterates that set, not the whole scene.
 */
export function createAnimationSubsystem() {
  return createSceneSubsystem<AnimationSubsystemState>({
    id: 'animation-runtime',
    createState(ctx) {
      const cache = ctx.ports.get(ResourceCachePortDef);
      return createAnimationSubsystemState({
        getAnimationClipData: (ref) => cache?.getAnimationClipData?.(ref) ?? null,
      });
    },
    events: {
      'entity-added': onEntityAddedAnimation,
      'entity-removed': onEntityRemovedAnimation,
      'component-changed': onComponentChangedAnimation,
      'scene-setup': onSceneSetupAnimation,
      'scene-teardown': onSceneTeardownAnimation,
    },
    phases: {
      earlyUpdate: animationTick,
    },
  });
}
