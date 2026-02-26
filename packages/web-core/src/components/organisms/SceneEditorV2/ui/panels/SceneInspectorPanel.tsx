'use client';

import * as React from 'react';

import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { getRememberedScrollTop, setRememberedScrollTop } from './inspectorUiMemory';

export function SceneInspectorPanel() {
    const editor = useSceneEditorV2Context();
    const scrollRef = React.useRef<HTMLDivElement | null>(null);

    const cameraEntities = React.useMemo(() => {
        return editor.allEntities
            .filter((e: any) => Boolean(e.getComponent('cameraView' as any)))
            .map((e: any) => {
                const label = (e.displayName && e.displayName.trim()) ? e.displayName.trim() : e.id;
                return { id: e.id, label };
            })
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
    }, [editor.allEntities]);

    const selectedCameraValue = editor.activeCameraEntityId ?? '';

    React.useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const remembered = getRememberedScrollTop('__scene__', 'scene');
        if (Math.abs(el.scrollTop - remembered) > 1) el.scrollTop = remembered;
    }, [editor.sceneRevision, editor.activeCameraEntityId, editor.resourceDisplayName]);

    const isLive = editor.gameState !== 'stopped';

    return (
        <div className="flex h-full flex-col overflow-hidden text-neutral-800">
            <div className="flex shrink-0 items-center justify-between border-b-2 border-black bg-black px-3 py-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-white">Inspector — Scene</span>
                {isLive && (
                    <span className="border border-amber-400 bg-amber-400 px-1.5 py-0.5 text-xs font-black uppercase text-black">
                        Live
                    </span>
                )}
            </div>

            <div
                ref={scrollRef}
                className="scrollbar min-h-0 flex-1 overflow-y-auto p-3"
                onScroll={(e) => setRememberedScrollTop('__scene__', 'scene', (e.currentTarget as HTMLDivElement).scrollTop)}
            >
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-black/50">Scene Name</label>
                        <input
                            className="w-full border-2 border-black bg-white px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main disabled:opacity-50"
                            value={editor.resourceDisplayName}
                            onChange={(e) => editor.onSetResourceDisplayName(e.target.value)}
                            onBlur={(e) => editor.onSaveResourceDisplayName(e.currentTarget.value)}
                            disabled={isLive}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-black/50">Active camera</label>
                        <select
                            className="w-full border-2 border-black bg-white px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main disabled:opacity-50"
                            value={selectedCameraValue}
                            onChange={(e) => editor.onSetActiveCameraEntityId(e.target.value ? e.target.value : null)}
                            disabled={isLive || cameraEntities.length === 0}
                        >
                            {cameraEntities.length === 0 ? (
                                <option value="">No cameras in scene</option>
                            ) : (
                                <>
                                    <option value="">Select camera…</option>
                                    {cameraEntities.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.label}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
