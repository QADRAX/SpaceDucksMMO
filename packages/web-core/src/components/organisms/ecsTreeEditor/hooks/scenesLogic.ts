import type { EditorMode, EditorResource } from '../types';

export type CameraPose = {
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export type PlayModeState = {
  mode: EditorMode;
  paused: boolean;
};

export function enterPlay(_state: PlayModeState): PlayModeState {
  return { mode: 'play', paused: false };
}

export function enterEdit(_state: PlayModeState): PlayModeState {
  return { mode: 'edit', paused: false };
}

export function togglePause(state: PlayModeState): PlayModeState {
  if (state.mode !== 'play') return state;
  return { ...state, paused: !state.paused };
}

export function makeSceneIds(resource: Pick<EditorResource, 'kind' | 'id'>): { editId: string; playId: string } {
  return {
    editId: `admin-${resource.kind}-edit-${resource.id}`,
    playId: `admin-${resource.kind}-play-${resource.id}`,
  };
}

export function sanitizeSelectedId(
  selectedId: string | null,
  entitiesById: { has: (id: string) => boolean }
): string | null {
  if (!selectedId) return null;
  return entitiesById.has(selectedId) ? selectedId : null;
}
