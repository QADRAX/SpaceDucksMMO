import * as React from 'react';
import { useEditorStore } from '../store';

export function useRendererLoop(args: {
    getEditorPluginTick: () => ((dt: number) => void) | null;
    onError: (msg: string) => void;
}) {
    const rafRef = React.useRef<number | null>(null);
    const isDisposedRef = React.useRef(false);

    const startLoop = React.useCallback(() => {
        let last = performance.now();

        const tick = (t: number) => {
            if (isDisposedRef.current) return;

            const dt = Math.min(t - last, 100);
            last = t;

            try {
                const { scene, engine: renderer, gameState } = useEditorStore.getState();

                if (!renderer) {
                    rafRef.current = requestAnimationFrame(tick);
                    return;
                }

                // 1. Editor plugin tick (always)
                const editorTick = args.getEditorPluginTick();
                if (editorTick) editorTick(dt);

                // 2. Game loop (only when playing)
                if (scene && gameState === 'playing') {
                    scene.gameUpdate(dt);
                }

                // 3. Render all views
                renderer.renderFrame();
            } catch (e) {
                args.onError(e instanceof Error ? e.message : 'Render loop error');
                return;
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [args]);

    const stopLoop = React.useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    React.useEffect(() => {
        isDisposedRef.current = false;
        return () => {
            isDisposedRef.current = true;
            stopLoop();
        };
    }, [stopLoop]);

    return { startLoop, stopLoop };
}
