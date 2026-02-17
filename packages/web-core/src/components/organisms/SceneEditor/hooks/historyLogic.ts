import type { SnapshotJson } from '../logic/sceneEditorRuntime';

export type HistoryState = {
  editSnapshotJson: SnapshotJson;
  historyPast: SnapshotJson[];
  historyFuture: SnapshotJson[];
  lastSavedJson: SnapshotJson;
};

export function commitJson(state: HistoryState, nextJson: SnapshotJson): HistoryState {
  if (state.editSnapshotJson === nextJson) return state;
  return {
    ...state,
    editSnapshotJson: nextJson,
    historyPast: [...state.historyPast, state.editSnapshotJson],
    historyFuture: [],
  };
}

export function canUndo(state: HistoryState): boolean {
  return state.historyPast.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.historyFuture.length > 0;
}

export function undo(state: HistoryState): { state: HistoryState; snapshot?: SnapshotJson } {
  if (!canUndo(state)) return { state };
  const prev = state.historyPast[state.historyPast.length - 1];
  const rest = state.historyPast.slice(0, -1);
  return {
    snapshot: prev,
    state: {
      ...state,
      editSnapshotJson: prev,
      historyPast: rest,
      historyFuture: [state.editSnapshotJson, ...state.historyFuture],
    },
  };
}

export function redo(state: HistoryState): { state: HistoryState; snapshot?: SnapshotJson } {
  if (!canRedo(state)) return { state };
  const next = state.historyFuture[0];
  const rest = state.historyFuture.slice(1);
  return {
    snapshot: next,
    state: {
      ...state,
      editSnapshotJson: next,
      historyPast: [...state.historyPast, state.editSnapshotJson],
      historyFuture: rest,
    },
  };
}

export function markSaved(state: HistoryState, savedJson?: SnapshotJson): HistoryState {
  return {
    ...state,
    lastSavedJson: savedJson ?? state.editSnapshotJson,
  };
}

export function isDirty(state: HistoryState): boolean {
  return state.editSnapshotJson !== state.lastSavedJson;
}
