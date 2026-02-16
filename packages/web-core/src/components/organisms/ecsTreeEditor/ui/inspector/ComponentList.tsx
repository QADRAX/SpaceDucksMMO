import * as React from 'react';
import { ComponentSelector } from '@/components/molecules/ComponentSelector';
import { useEcsTreeEditorContext } from '../../EcsTreeEditorContext';
import { ComponentListItem } from './ComponentListItem';

interface ComponentListProps {
    selectedComponents: any[];
    creatableComponents: any[];
    editor: ReturnType<typeof useEcsTreeEditorContext>;
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
            <div className="sticky top-0 z-10 border-b border-border bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">Components</div>
                    <ComponentSelector
                        components={creatableComponents}
                        onSelect={(type) => editor.onAddComponent(type)}
                        disabled={editor.mode !== 'edit'}
                    />
                </div>
            </div>

            <div className="border-t border-border">
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
