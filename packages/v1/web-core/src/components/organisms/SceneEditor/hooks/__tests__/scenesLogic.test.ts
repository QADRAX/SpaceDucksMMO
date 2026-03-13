import { enterEdit, enterPlay, makeSceneIds, sanitizeSelectedId, togglePause } from '../scenesLogic';

describe('SceneEditor scenesLogic', () => {
  test('makeSceneIds generates stable ids', () => {
    const ids = makeSceneIds({ kind: 'scene', id: 'abc' } as any);
    expect(ids).toEqual({ editId: 'admin-scene-edit-abc', playId: 'admin-scene-play-abc' });
  });

  test('sanitizeSelectedId returns null when missing', () => {
    const entitiesById = new Map<string, unknown>([['a', {}]]);
    expect(sanitizeSelectedId('b', entitiesById)).toBeNull();
  });

  test('sanitizeSelectedId keeps id when present', () => {
    const entitiesById = new Map<string, unknown>([['a', {}]]);
    expect(sanitizeSelectedId('a', entitiesById)).toBe('a');
  });

  test('enterPlay always unpauses', () => {
    expect(enterPlay({ mode: 'edit', paused: true })).toEqual({ mode: 'play', paused: false });
  });

  test('togglePause only toggles in play', () => {
    expect(togglePause({ mode: 'edit', paused: false })).toEqual({ mode: 'edit', paused: false });
    expect(togglePause({ mode: 'play', paused: false })).toEqual({ mode: 'play', paused: true });
  });

  test('enterEdit always unpauses', () => {
    expect(enterEdit({ mode: 'play', paused: true })).toEqual({ mode: 'edit', paused: false });
  });
});
