'use client';

import * as React from 'react';
import type { ViewportDef } from '../types';
import { useStableEvent } from '../useStableEvent';

/**
 * useEditorLayout — tracks active viewport registrations.
 *
 * The layout structure (splits, sizes) is owned by EditorLayout.tsx.
 * This hook only tracks which ThreeMultiRenderer views are alive,
 * so the renderer loop knows which views to render.
 */
export function useEditorLayout() {
    const [viewports, setViewports] = React.useState<ViewportDef[]>([]);

    const registerViewport = useStableEvent((def: ViewportDef) => {
        setViewports((prev) => [
            ...prev.filter((v) => v.viewId !== def.viewId),
            def,
        ]);
    });

    const unregisterViewport = useStableEvent((viewId: string) => {
        setViewports((prev) => prev.filter((v) => v.viewId !== viewId));
    });

    return { viewports, registerViewport, unregisterViewport };
}
