import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { EditorPanelSlot } from '../../plugins/EditorPanelSlot';

interface HierarchyHeaderProps {
    editor: ReturnType<typeof useSceneEditorV2Context>;
}

export function HierarchyHeader({ editor }: HierarchyHeaderProps) {
    return (
        <div
            className="flex shrink-0 items-center justify-between border-b-2 border-black bg-black px-3 py-1.5 cursor-pointer"
            onClick={() => editor.setSelectedId(null)}
        >
            <span className="text-xs font-black uppercase tracking-widest text-white">Hierarchy</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <EditorPanelSlot slotId="hierarchy.header-actions" className="flex items-center gap-1 mr-1" />

                <button
                    className="flex h-6 w-6 items-center justify-center bg-white text-black font-black hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                    onClick={editor.onCreateEmpty}
                    disabled={editor.gameState !== 'stopped'}
                    title="Add Entity"
                >
                    +
                </button>
                <button
                    className="flex h-6 w-6 items-center justify-center bg-white text-black font-black hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                    onClick={editor.onDeleteSelected}
                    disabled={editor.gameState !== 'stopped' || !editor.selectedId}
                    title="Delete Selected"
                >
                    -
                </button>
            </div>
        </div>
    );
}
