import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { useSceneEditorContext } from '../../SceneEditorContext';

interface HierarchyHeaderProps {
    editor: ReturnType<typeof useSceneEditorContext>;
}

export function HierarchyHeader({ editor }: HierarchyHeaderProps) {
    return (
        <div
            className="flex items-center justify-between border-b border-border p-2"
            onClick={() => editor.setSelectedId(null)}
        >
            <div className="text-sm font-bold">Hierarchy</div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button onClick={editor.onCreateEmpty} disabled={editor.mode !== 'edit'} variant="secondary" size="sm">
                    +
                </Button>
                <Button
                    onClick={editor.onDeleteSelected}
                    disabled={editor.mode !== 'edit' || !editor.selectedId}
                    variant="secondary"
                    size="sm"
                >
                    -
                </Button>
            </div>
        </div>
    );
}
