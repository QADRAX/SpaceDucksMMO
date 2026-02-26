import * as React from 'react';
import { ComponentSelector } from '@/components/molecules/ComponentSelector';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { ComponentListItem } from './ComponentListItem';

import { useEditorStore, type SceneEditorState } from '../../store';

interface ComponentListProps {
    selectedComponents: any[];
    creatableComponents: any[];
    selectionKey: string;
    tab: string;
    referenceOptions: any[];
}

export function ComponentList({
    selectedComponents,
    creatableComponents,
    selectionKey,
    tab,
    referenceOptions,
}: ComponentListProps) {
    const gameState = useEditorStore((s: SceneEditorState) => s.gameState);
    const onAddComponent = useEditorStore((s: SceneEditorState) => s.onAddComponent);

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-widest text-black/50">Components</div>
                    <ComponentSelector
                        components={creatableComponents}
                        onSelect={(type) => onAddComponent(type)}
                        disabled={gameState !== 'stopped'}
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
