import * as React from 'react';
import { ComponentSelector } from '@/components/molecules/ComponentSelector';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { ComponentListItem } from './ComponentListItem';

interface ComponentListProps {
    selectedComponents: any[];
    creatableComponents: any[];
    editor: ReturnType<typeof useSceneEditorV2Context>;
    selectionKey: string;
    tab: string;
    referenceOptions: any[];
}

export function ComponentList({
    selectedComponents,
    creatableComponents,
    editor,
    selectionKey,
    tab,
    referenceOptions,
}: ComponentListProps) {
    return (
        <>
            <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-widest text-black/50">Components</div>
                    <ComponentSelector
                        components={creatableComponents}
                        onSelect={(type) => editor.onAddComponent(type)}
                        disabled={editor.gameState !== 'stopped'}
                    />
                </div>
            </div>

            <div className="border-t border-black/10">
                {selectedComponents.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-neutral-600">No components.</div>
                ) : (
                    selectedComponents.map((c: any) => (
                        <ComponentListItem
                            key={c.type}
                            component={c}
                            editor={editor}
                            selectionKey={selectionKey}
                            tab={tab}
                            referenceOptions={referenceOptions}
                        />
                    ))
                )}
            </div>
        </>
    );
}
