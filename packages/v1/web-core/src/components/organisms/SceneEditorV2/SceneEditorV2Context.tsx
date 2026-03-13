'use client';

import * as React from 'react';
import type { SceneEditorV2Store } from './types';

const SceneEditorV2Context = React.createContext<SceneEditorV2Store | null>(null);

export function SceneEditorV2Provider({
    value,
    children,
}: {
    value: SceneEditorV2Store;
    children: React.ReactNode;
}) {
    return (
        <SceneEditorV2Context.Provider value={value}>
            {children}
        </SceneEditorV2Context.Provider>
    );
}

export function useSceneEditorV2Context(): SceneEditorV2Store {
    const ctx = React.useContext(SceneEditorV2Context);
    if (!ctx) {
        throw new Error('useSceneEditorV2Context must be used within a SceneEditorV2Provider');
    }
    return ctx;
}
