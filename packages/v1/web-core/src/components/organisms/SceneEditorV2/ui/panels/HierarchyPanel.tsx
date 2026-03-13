'use client';

import * as React from 'react';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { HierarchyProvider } from '../hierarchy/HierarchyContext';
import { HierarchyHeader } from '../hierarchy/HierarchyHeader';
import { HierarchyList } from '../hierarchy/HierarchyList';
import { EditorPanelSlot } from '../../plugins/EditorPanelSlot';

/**
 * HierarchyPanel — entity tree with click-to-select.
 * Full drag-to-reparent and nested tree in Phase 4.
 */
export function HierarchyPanel() {
    const editor = useSceneEditorV2Context();

    return (
        <HierarchyProvider>
            <div className="flex h-full flex-col overflow-hidden text-neutral-800">
                <HierarchyHeader editor={editor} />
                <HierarchyList editor={editor} />
                <EditorPanelSlot slotId="hierarchy.footer" className="shrink-0 border-t-2 border-black bg-white" />
            </div>
        </HierarchyProvider>
    );
}
