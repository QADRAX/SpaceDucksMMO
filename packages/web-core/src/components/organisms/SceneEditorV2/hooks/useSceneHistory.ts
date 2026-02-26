'use client';

import * as React from 'react';
import type { EcsTreeSnapshot } from '../logic/liveSceneRuntime';

const MAX_HISTORY = 50;

export type HistoryEntry = {
    reason: string;
    snapshot: EcsTreeSnapshot;
};


/**
 * Manages an undo/redo stack of scene snapshots.
 *
 * - `commit(snapshot, reason)` — push a new snapshot onto the stack
 * - `undo()` / `redo()` — navigate the stack
 * - `current` — the snapshot at the current position
 * - `canUndo` / `canRedo` — navigation availability
 */
export function useSceneHistory(initialSnapshot: EcsTreeSnapshot) {
    // Stack of past snapshots. Index 0 = oldest, last = newest.
    const [stack, setStack] = React.useState<HistoryEntry[]>([
        { reason: 'initial', snapshot: initialSnapshot },
    ]);
    const [cursor, setCursor] = React.useState(0);

    const current = stack[cursor]?.snapshot ?? initialSnapshot;
    const canUndo = cursor > 0;
    const canRedo = cursor < stack.length - 1;

    const commit = React.useCallback((snapshot: EcsTreeSnapshot, reason: string) => {
        setStack((prev) => {
            // Truncate redo tail, append new entry, cap at MAX_HISTORY
            const truncated = prev.slice(0, cursor + 1);
            const next = [...truncated, { reason, snapshot }];
            if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
            return next;
        });
        setCursor((c) => Math.min(c + 1, MAX_HISTORY - 1));
    }, [cursor]);

    const undo = React.useCallback(() => {
        if (!canUndo) return;
        setCursor((c) => c - 1);
    }, [canUndo]);

    const redo = React.useCallback(() => {
        if (!canRedo) return;
        setCursor((c) => c + 1);
    }, [canRedo]);

    /** Replace the snapshot at the current cursor in-place (no new history entry). */
    const replace = React.useCallback((snapshot: EcsTreeSnapshot, reason: string) => {
        setStack((prev) => {
            const next = [...prev];
            next[cursor] = { reason, snapshot };
            return next;
        });
    }, [cursor]);

    return { current, canUndo, canRedo, commit, undo, redo, replace };
}
