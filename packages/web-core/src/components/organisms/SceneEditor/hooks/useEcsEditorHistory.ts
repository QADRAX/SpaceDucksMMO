'use client';

import * as React from 'react';

import type { SnapshotJson } from '../logic/sceneEditorRuntime';
import { safeParseSnapshotJson, snapshotToJson } from '../logic/sceneEditorRuntime';
import {
  type EcsTreeSnapshot,
  serializeEcsTreeFromRoots,
  deserializeEcsTreeSnapshotToEntities,
  parseEcsTreeSnapshot,
} from '@/lib/ecs-snapshot';

import * as historyLogic from './historyLogic';

function canonicalizeInitialSnapshotJson(initialComponentDataJson: string | null): SnapshotJson {
  const input = safeParseSnapshotJson(initialComponentDataJson);
  return snapshotToJson(parseEcsTreeSnapshot(input));
}

export function useEcsEditorHistory(args: { initialComponentDataJson: string | null }) {
  const [state, setState] = React.useState<historyLogic.HistoryState>(() => {
    const initial = canonicalizeInitialSnapshotJson(args.initialComponentDataJson);
    return {
      editSnapshotJson: initial,
      historyPast: [],
      historyFuture: [],
      lastSavedJson: initial,
    };
  });

  const commitJson = React.useCallback((nextJson: SnapshotJson) => {
    setState((prev) => historyLogic.commitJson(prev, nextJson));
  }, []);

  const canUndo = historyLogic.canUndo(state);
  const canRedo = historyLogic.canRedo(state);

  const undo = React.useCallback((): SnapshotJson | undefined => {
    let snapshot: SnapshotJson | undefined;
    setState((prev) => {
      const res = historyLogic.undo(prev);
      snapshot = res.snapshot;
      return res.state;
    });
    return snapshot;
  }, []);

  const redo = React.useCallback((): SnapshotJson | undefined => {
    let snapshot: SnapshotJson | undefined;
    setState((prev) => {
      const res = historyLogic.redo(prev);
      snapshot = res.snapshot;
      return res.state;
    });
    return snapshot;
  }, []);

  const markSaved = React.useCallback((savedJson?: SnapshotJson) => {
    setState((prev) => historyLogic.markSaved(prev, savedJson));
  }, []);

  const dirty = historyLogic.isDirty(state);

  return {
    editSnapshotJson: state.editSnapshotJson,
    commitJson,
    canUndo,
    canRedo,
    undo,
    redo,
    dirty,
    markSaved,
  };
}
