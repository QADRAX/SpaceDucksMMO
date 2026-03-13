'use client';

import * as React from 'react';
import type { EditorResource } from './types';
import { useSceneEditorV2 } from './useSceneEditorV2';
import { SceneEditorV2Provider } from './SceneEditorV2Context';
import { EditorLayout } from './ui/EditorLayout';
import { EditorToolbar } from './ui/toolbar/EditorToolbar';

export type SceneEditorV2Props = {
    resource: EditorResource;
    initialComponentDataJson: string | null;
};

/**
 * SceneEditorV2 — main entry point for the new scene editor.
 *
 * Composes:
 *  - useSceneEditorV2 (the full store)
 *  - SceneEditorV2Provider (context)
 *  - EditorToolbar (global Play/Stop/Undo/Save bar)
 *  - EditorLayout (resizable panel workspace)
 */
export function SceneEditorV2(props: SceneEditorV2Props) {
    const store = useSceneEditorV2({
        resource: props.resource,
        initialComponentDataJson: props.initialComponentDataJson,
    });

    return (
        <SceneEditorV2Provider value={store}>
            <div className="flex h-full flex-col overflow-hidden border-2 border-black">
                <EditorToolbar />
                <EditorLayout />
            </div>
        </SceneEditorV2Provider>
    );
}
