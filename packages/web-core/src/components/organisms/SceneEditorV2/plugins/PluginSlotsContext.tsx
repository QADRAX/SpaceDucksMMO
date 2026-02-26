'use client';

import * as React from 'react';
import type { EditorPluginRegistry } from './pluginTypes';

export const PluginSlotsContext = React.createContext<EditorPluginRegistry | null>(null);

export function PluginSlotsProvider({
    registry,
    children,
}: {
    registry: EditorPluginRegistry;
    children: React.ReactNode;
}) {
    // Simply distribute the registry down to the UI
    return (
        <PluginSlotsContext.Provider value={registry}>
            {children}
        </PluginSlotsContext.Provider>
    );
}
