import {
  createSceneId,
  createViewportId,
  createEntityId,
} from '../ids';
import { resolveUiTargetViewports } from './resolveUiTargetViewports';
import type { UiTarget } from './uiTarget';

describe('resolveUiTargetViewports', () => {
  const sceneId = createSceneId('main');
  const otherScene = createSceneId('other');
  const vp1 = createViewportId('vp-1');
  const vp2 = createViewportId('vp-2');
  const vp3 = createViewportId('vp-3');
  const cam1 = createEntityId('cam-1');
  const cam2 = createEntityId('cam-2');

  const viewports = [
    { id: vp1, sceneId, cameraEntityId: cam1, enabled: true },
    { id: vp2, sceneId, cameraEntityId: cam2, enabled: true },
    { id: vp3, sceneId, cameraEntityId: cam1, enabled: false },
    {
      id: createViewportId('vp-other'),
      sceneId: otherScene,
      cameraEntityId: cam1,
      enabled: true,
    },
  ];

  it('returns all enabled scene viewports when target is empty', () => {
    expect(
      resolveUiTargetViewports({ sceneId, target: {}, viewports }),
    ).toEqual([vp1, vp2]);
    expect(
      resolveUiTargetViewports({ sceneId, target: undefined, viewports }),
    ).toEqual([vp1, vp2]);
  });

  it('filters by viewportIds', () => {
    const target: UiTarget = { viewportIds: [vp2] };
    expect(resolveUiTargetViewports({ sceneId, target, viewports })).toEqual([vp2]);
  });

  it('filters by cameraIds', () => {
    const target: UiTarget = { cameraIds: [cam1] };
    expect(resolveUiTargetViewports({ sceneId, target, viewports })).toEqual([vp1]);
  });

  it('filters by cameraTags via cameraHasTag', () => {
    const target: UiTarget = { cameraTags: ['player-1'] };
    const cameraHasTag = (id: typeof cam1, tag: string) =>
      id === cam2 && tag === 'player-1';
    expect(
      resolveUiTargetViewports({ sceneId, target, viewports, cameraHasTag }),
    ).toEqual([vp2]);
  });

  it('ORs across criterion groups', () => {
    const target: UiTarget = { viewportIds: [vp1], cameraIds: [cam2] };
    expect(resolveUiTargetViewports({ sceneId, target, viewports })).toEqual([
      vp1,
      vp2,
    ]);
  });
});
