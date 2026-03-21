import type {
  AnimationClipFileData,
  AnimatorComponent,
  EntityId,
  EntityState,
  ResourceRef,
  SceneState,
} from '@duckengine/core-v2';
import { getComponent } from '@duckengine/core-v2';

/** True if this entity should be driven by the animation earlyUpdate tick. */
export function shouldTrackAnimatorEntity(entity: EntityState): boolean {
  const anim = getComponent<AnimatorComponent>(entity, 'animator');
  return anim != null && anim.enabled;
}

/**
 * Per-scene animation subsystem state: clip resolution + registry of entities with an enabled
 * `animator` (maintained via scene events, not full-scene scans each frame).
 */
export interface AnimationSubsystemState {
  readonly getAnimationClipData: (ref: ResourceRef<'animationClip'>) => AnimationClipFileData | null;
  /** Entities to tick; subset of the scene. */
  readonly animatedEntityIds: ReadonlySet<EntityId>;
  syncAnimatorForEntity(entity: EntityState): void;
  removeAnimatorEntity(entityId: EntityId): void;
  reconcileAnimatorsInScene(scene: SceneState): void;
  clearAnimatedEntities(): void;
}

export function createAnimationSubsystemState(options: {
  readonly getAnimationClipData: (ref: ResourceRef<'animationClip'>) => AnimationClipFileData | null;
}): AnimationSubsystemState {
  const animatedEntityIds = new Set<EntityId>();

  function syncAnimatorForEntity(entity: EntityState): void {
    if (shouldTrackAnimatorEntity(entity)) {
      animatedEntityIds.add(entity.id);
    } else {
      animatedEntityIds.delete(entity.id);
    }
  }

  return {
    getAnimationClipData: options.getAnimationClipData,
    get animatedEntityIds(): ReadonlySet<EntityId> {
      return animatedEntityIds;
    },
    syncAnimatorForEntity,
    removeAnimatorEntity(entityId) {
      animatedEntityIds.delete(entityId);
    },
    reconcileAnimatorsInScene(scene) {
      for (const entity of scene.entities.values()) {
        syncAnimatorForEntity(entity);
      }
    },
    clearAnimatedEntities() {
      animatedEntityIds.clear();
    },
  };
}
