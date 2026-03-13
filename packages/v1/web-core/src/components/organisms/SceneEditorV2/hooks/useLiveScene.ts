'use client';

import * as React from 'react';
import type { EcsLiveScene } from '../logic/EcsLiveScene';
import {
    serializeLiveScene,
    restoreSceneFromSnapshot,
    type EcsTreeSnapshot,
} from '../logic/liveSceneRuntime';
import { useStableEvent } from '../useStableEvent';
import type { GameState } from '../types';

/**
 * useLiveScene — manages the EcsLiveScene lifecycle:
 * - play / pause / resume / stop transitions
 * - snapshot capture/restore on play/stop
 * - bridging to history (commitFromCurrentScene)
 */
export function useLiveScene(args: {
    sceneRef: React.RefObject<EcsLiveScene | null>;
    commitToHistory: (snapshot: EcsTreeSnapshot, reason: string) => void;
    setSceneRevision: React.Dispatch<React.SetStateAction<number>>;
    setError: (e: string | null) => void;
}) {
    const [gameState, setGameState] = React.useState<GameState>('stopped');
    const gameStateRef = React.useRef<GameState>('stopped');

    const syncState = (next: GameState) => {
        gameStateRef.current = next;
        setGameState(next);
    };

    // ── History commit ────────────────────────────────────────────────────

    const commitFromCurrentScene = useStableEvent((reason: string = 'editor-action') => {
        const scene = args.sceneRef.current;
        if (!scene) return;
        // Only commit when stopped (game frames don't touch history)
        if (gameStateRef.current !== 'stopped') return;
        try {
            const snapshot = serializeLiveScene(scene);
            args.commitToHistory(snapshot, reason);
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Failed to capture history entry');
        }
    });

    // ── Apply snapshot to scene (undo/redo) ──────────────────────────────

    const applySnapshot = useStableEvent((snapshot: EcsTreeSnapshot) => {
        if (gameStateRef.current !== 'stopped') return; // no undo during play
        const scene = args.sceneRef.current;
        if (!scene) return;
        try {
            restoreSceneFromSnapshot(scene, snapshot);
            args.setSceneRevision((r) => r + 1);
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Failed to apply snapshot');
        }
    });

    // ── Play / Pause / Resume / Stop ─────────────────────────────────────

    const onPlay = useStableEvent(async () => {
        const scene = args.sceneRef.current;
        if (!scene || gameStateRef.current !== 'stopped') return;
        try {
            await scene.play(() => serializeLiveScene(scene));
            syncState('playing');
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Failed to start play');
        }
    });

    const onPause = useStableEvent(() => {
        const scene = args.sceneRef.current;
        if (!scene || gameStateRef.current !== 'playing') return;
        scene.pause();
        syncState('paused');
    });

    const onResume = useStableEvent(() => {
        const scene = args.sceneRef.current;
        if (!scene || gameStateRef.current !== 'paused') return;
        scene.resume();
        syncState('playing');
    });

    const onStop = useStableEvent(async () => {
        const scene = args.sceneRef.current;
        if (!scene || gameStateRef.current === 'stopped') return;
        try {
            await scene.stop((snapshot) => {
                restoreSceneFromSnapshot(scene, snapshot);
                args.setSceneRevision((r) => r + 1);
            });
            syncState('stopped');
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Failed to stop play');
        }
    });

    return {
        gameState,
        gameStateRef,
        onPlay,
        onPause,
        onResume,
        onStop,
        commitFromCurrentScene,
        applySnapshot,
    };
}
