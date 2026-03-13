import { commitJson, redo, undo, markSaved, isDirty, type HistoryState } from '../historyLogic';

function s(init: Partial<HistoryState> & Pick<HistoryState, 'editSnapshotJson' | 'lastSavedJson'>): HistoryState {
  return {
    historyPast: [],
    historyFuture: [],
    ...init,
  };
}

describe('SceneEditor historyLogic', () => {
  test('commitJson pushes past and clears future', () => {
    const state0 = s({ editSnapshotJson: 'A', lastSavedJson: 'A' });
    const state1 = commitJson(state0, 'B');

    expect(state1.editSnapshotJson).toBe('B');
    expect(state1.historyPast).toEqual(['A']);
    expect(state1.historyFuture).toEqual([]);
  });

  test('undo moves current to future and returns previous', () => {
    const state0 = s({
      editSnapshotJson: 'C',
      lastSavedJson: 'C',
      historyPast: ['A', 'B'],
      historyFuture: [],
    } as any);

    const { state: state1, snapshot } = undo(state0);
    expect(snapshot).toBe('B');
    expect(state1.editSnapshotJson).toBe('B');
    expect(state1.historyPast).toEqual(['A']);
    expect(state1.historyFuture).toEqual(['C']);
  });

  test('redo moves current to past and returns next', () => {
    const state0 = s({
      editSnapshotJson: 'B',
      lastSavedJson: 'B',
      historyPast: ['A'],
      historyFuture: ['C', 'D'],
    } as any);

    const { state: state1, snapshot } = redo(state0);
    expect(snapshot).toBe('C');
    expect(state1.editSnapshotJson).toBe('C');
    expect(state1.historyPast).toEqual(['A', 'B']);
    expect(state1.historyFuture).toEqual(['D']);
  });

  test('dirty follows lastSavedJson', () => {
    let state = s({ editSnapshotJson: 'A', lastSavedJson: 'A' });
    expect(isDirty(state)).toBe(false);

    state = commitJson(state, 'B');
    expect(isDirty(state)).toBe(true);

    state = markSaved(state);
    expect(isDirty(state)).toBe(false);

    state = commitJson(state, 'C');
    expect(isDirty(state)).toBe(true);
  });
});
