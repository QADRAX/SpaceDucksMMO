import type {
  SubsystemUpdateParams,
  SubsystemUseCase,
  AnimatorComponent,
  AnimationClipFileData,
  EntityState,
} from '@duckengine/core-v2';
import {
  defineSubsystemUseCase,
  getComponent,
  updateComponent,
  setPosition,
  setScale,
  setRotationFromQuaternion,
} from '@duckengine/core-v2';
import type { AnimationSubsystemState } from '../domain/createAnimationSubsystemState';
import { wrapPlaybackTimeForClip } from '../domain/wrapPlaybackTime';
import { sampleAnimationChannelAtTime, type SampledChannel } from '../domain/sampleAnimationChannel';

function applySampleToEntity(target: EntityState, sampled: SampledChannel): void {
  if (sampled.path === 'translation') {
    setPosition(target.transform, sampled.v.x, sampled.v.y, sampled.v.z);
  } else if (sampled.path === 'scale') {
    setScale(target.transform, sampled.v.x, sampled.v.y, sampled.v.z);
  } else if (sampled.path === 'rotation') {
    setRotationFromQuaternion(target.transform, sampled.q);
  }
}

/**
 * earlyUpdate: sample active animation clips, advance animator time, write TRS on target entities.
 * Runs before physics and before scripting earlyUpdate when registered first in `sceneSubsystems`.
 */
export const animationTick: SubsystemUseCase<AnimationSubsystemState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<AnimationSubsystemState, SubsystemUpdateParams, void>({
    name: 'animation/animationTick',
    execute(state, { scene, dt }) {
      const getClipData = state.getAnimationClipData;

      for (const entityId of state.animatedEntityIds) {
        const entity = scene.entities.get(entityId);
        if (!entity) {
          state.removeAnimatorEntity(entityId);
          continue;
        }

        const anim = getComponent<AnimatorComponent>(entity, 'animator');
        if (!anim?.enabled) continue;

        const clipRefs = anim.clips;
        if (clipRefs.length === 0) continue;

        const activeIndex = Math.max(0, Math.min(clipRefs.length - 1, anim.activeClipIndex));
        const clipRef = clipRefs[activeIndex]!;
        const clip: AnimationClipFileData | null = getClipData(clipRef);
        if (!clip) continue;

        const duration = clip.duration;
        let nextTime = anim.time;
        if (anim.playing) {
          nextTime += dt * anim.speed;
        }
        nextTime = wrapPlaybackTimeForClip(nextTime, duration, anim.loop);

        updateComponent(entity, 'animator', (c) => {
          const a = c as AnimatorComponent;
          a.time = nextTime;
        });

        const sampleTime = nextTime;
        for (const channel of clip.channels) {
          const target = scene.entities.get(channel.targetEntityId);
          if (!target) continue;
          const sampled = sampleAnimationChannelAtTime(channel, sampleTime);
          if (!sampled) continue;
          if (sampled.path === 'weights') continue;
          applySampleToEntity(target, sampled);
        }
      }
    },
  });
