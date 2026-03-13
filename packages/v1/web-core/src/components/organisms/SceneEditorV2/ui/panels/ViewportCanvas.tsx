'use client';

import * as React from 'react';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';

/**
 * ViewportCanvas — renders a Three.js viewport.
 *
 * On mount: registers a view in ThreeMultiRenderer via `registerViewport`.
 * On unmount: deregisters the view.
 *
 * Multiple ViewportCanvas instances can coexist, each with its own view
 * in the ThreeMultiRenderer — all rendering the same scene simultaneously.
 */
export interface ViewportCanvasProps {
    /** Stable id for the ThreeMultiRenderer view. */
    viewId: string;
    /** Entity id of the camera to render from. Defaults to scene active camera. */
    cameraEntityId?: string;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({ viewId, cameraEntityId }) => {
    const editor = useSceneEditorV2Context();
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        editor.registerViewport({ viewId, cameraEntityId });
        const canvas = canvasRef.current;
        const engine = editor.engine;
        if (!canvas || !engine || typeof engine.addView !== 'function') return;

        engine.addView(canvas, {
            cameraId: editor.activeCameraEntityId ?? undefined,
        });

        const handleFocus = () => { try { editor.input?.keyboard.setEnabled(true); } catch (e) { } };
        const handleBlur = () => { try { editor.input?.keyboard.setEnabled(false); } catch (e) { } };
        const handleClick = () => {
            const mouse = editor.input?.mouse;
            if (mouse) {
                mouse.setTargetElement(canvas);
                mouse.requestPointerLock();
            }
        };

        canvas.addEventListener('focus', handleFocus);
        canvas.addEventListener('blur', handleBlur);
        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('focus', handleFocus);
            canvas.removeEventListener('blur', handleBlur);
            canvas.removeEventListener('click', handleClick);

            if (typeof engine.removeView === 'function') {
                engine.removeView(canvas);
            }
        };
    }, [editor.engine, editor.activeCameraEntityId, editor.input]);

    // TODO: pointer-lock interaction later

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-gray-400">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ touchAction: 'none' }}
                tabIndex={0}
            />

            {/* Game state badge */}
            {editor.gameState !== 'stopped' && (
                <div className="pointer-events-none absolute left-2 top-2 z-10">
                    <span
                        className={[
                            'border-2 border-black px-2 py-0.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_#000]',
                            editor.gameState === 'playing'
                                ? 'bg-green-400 text-black'
                                : 'bg-amber-400 text-black',
                        ].join(' ')}
                    >
                        {editor.gameState === 'playing' ? '▶ PLAY' : '⏸ PAUSED'}
                    </span>
                </div>
            )}
        </div>
    );
}
