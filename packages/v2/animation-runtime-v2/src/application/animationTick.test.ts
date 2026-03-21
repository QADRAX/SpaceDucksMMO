import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createEntity,
  createEntityId,
  addComponent,
  createComponent,
  createResourceKey,
  createResourceRef,
  getComponent,
} from '@duckengine/core-v2';
import type { AnimationClipFileData, SceneState } from '@duckengine/core-v2';
import type { AnimatorComponent } from '@duckengine/core-v2';
import { animationTick } from './animationTick';
import { createAnimationSubsystemState } from '../domain/createAnimationSubsystemState';

function makeSceneWithEntities(...entities: ReturnType<typeof createEntity>[]): SceneState {
  const map = new Map(entities.map((e) => [e.id, e] as const));
  return { entities: map } as unknown as SceneState;
}

describe('animationTick', () => {
  const clipKey = createResourceKey('clips/walk');
  const clipRef = createResourceRef(clipKey, 'animationClip');

  const clipData: AnimationClipFileData = {
    duration: 1,
    channels: [
      {
        targetEntityId: createEntityId('joint-a'),
        path: 'translation',
        interpolation: 'linear',
        times: [0, 1],
        values: [0, 0, 0, 10, 0, 0],
      },
    ],
  };

  let state: ReturnType<typeof createAnimationSubsystemState>;

  beforeEach(() => {
    state = createAnimationSubsystemState({
      getAnimationClipData: (ref) => (ref.key === clipKey ? clipData : null),
    });
  });

  it('samples the active clip and writes translation to the joint entity (before physics/render)', () => {
    const joint = createEntity(createEntityId('joint-a'));
    const animEntity = createEntity(createEntityId('rig'));
    addComponent(
      animEntity,
      createComponent('animator', {
        clips: [clipRef],
        activeClipIndex: 0,
        playing: true,
        loop: true,
        speed: 1,
        time: 0,
      }),
    );

    state.syncAnimatorForEntity(animEntity);
    const scene = makeSceneWithEntities(animEntity, joint);

    animationTick.execute(state, { scene, dt: 0.5 });

    const jt = joint.transform;
    expect(jt.localPosition.x).toBeCloseTo(5, 5);
    expect(jt.localPosition.y).toBeCloseTo(0, 5);
    expect(jt.localPosition.z).toBeCloseTo(0, 5);

    const anim = getComponent<AnimatorComponent>(animEntity, 'animator');
    expect(anim?.time).toBeCloseTo(0.5, 5);
  });
});
