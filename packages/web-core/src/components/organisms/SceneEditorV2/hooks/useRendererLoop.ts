'use client';

import * as React from 'react';
import type { ThreeMultiRenderer } from '@duckengine/rendering-three';
import type { EcsLiveScene } from '../logic/EcsLiveScene';
import type { GameState } from '../types';

/**
 * useRendererLoop — the requestAnimationFrame loop for the editor.
 *
 * Responsibilities:
 * 1. Initialises the ThreeMultiRenderer on the primary viewport container.
 * 2. Runs the RAF loop, calling:
 *    a. editorPluginSystem.tick(dt)  — always, independent of game state
 *    b. scene.gameUpdate(dt)         — only when gameState === 'playing'
 *    c. renderer.renderFrame()       — always
 * 3. Handles resize observation on the container.
 *
 * NOTE: The actual ThreeMultiRenderer instantiation depends on imports that
 * live in the rendering-three package. This hook wires the loop; the renderer
 * is passed in after being created by the parent (useSceneEditorV2).
 */
export function useRendererLoop(args: {
    primaryViewportRef: React.RefObject<HTMLDivElement | null>;
    rendererRef: React.RefObject<ThreeMultiRenderer | null>;
    sceneRef: React.RefObject<EcsLiveScene | null>;
    gameStateRef: React.RefObject<GameState>;
    getEditorPluginTick: () => ((dt: number) => void) | null;
    onError: (msg: string) => void;
    onCapturePose?: (scene: EcsLiveScene) => void;
}) {
    const rafRef = React.useRef<number | null>(null);
    const isDisposedRef = React.useRef(false);

    // Start the loop after renderer is initialised
    const startLoop = React.useCallback(() => {
        let last = performance.now();

        const tick = (t: number) => {
            if (isDisposedRef.current) return;

            const dt = Math.min(t - last, 100); // cap dt to 100ms
            last = t;

            try {
                const scene = args.sceneRef.current;
                const renderer = args.rendererRef.current;
                if (!renderer) { rafRef.current = requestAnimationFrame(tick); return; }

                // 1. Editor plugin tick (always)
                const editorTick = args.getEditorPluginTick();
                if (editorTick) editorTick(dt);

                // 2. Game loop (only when playing)
                if (scene && args.gameStateRef.current === 'playing') {
                    scene.gameUpdate(dt);
                }

                // 3. Optional pose capture (for camera persistence)
                if (scene) args.onCapturePose?.(scene);

                // 4. Render all views
                renderer.renderFrame();
            } catch (e) {
                args.onError(e instanceof Error ? e.message : 'Render loop error');
                return; // stop loop on unrecoverable error
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stopLoop = React.useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    React.useEffect(() => {
        isDisposedRef.current = false;
        return () => {
            isDisposedRef.current = true;
            stopLoop();
        };
    }, [stopLoop]);

    return { startLoop, stopLoop };
}
