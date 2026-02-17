import * as React from 'react';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { EmojiPickerDialog } from '@/components/molecules/EmojiPickerDialog';
import { TransformEditor } from '@/components/molecules/TransformEditor';
import { useSceneEditorContext } from '../../SceneEditorContext';

interface EntityInspectorProps {
    selected: any;
    editor: ReturnType<typeof useSceneEditorContext>;
}

export function EntityInspector({ selected, editor }: EntityInspectorProps) {
    const selectedNameValue = selected?.displayName ?? '';
    const selectedGizmoIconValue = selected?.gizmoIcon ?? '';

    return (
        <div className="flex flex-col">
            <div className="border-b border-border px-3 py-3">
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                        value={selectedNameValue}
                        onChange={(e) => editor.onSetSelectedName(e.target.value)}
                        disabled={editor.mode !== 'edit'}
                    />
                </div>
            </div>

            <div className="border-b border-border px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                    <Label>Gizmo Icon</Label>
                    <EmojiPickerDialog
                        title="Choose gizmo icon"
                        value={selectedGizmoIconValue}
                        onChange={(next) => editor.onSetSelectedGizmoIcon(next)}
                        disabled={editor.mode !== 'edit'}
                        triggerAriaLabel="Choose gizmo icon"
                    />
                </div>
            </div>

            <div className="px-3 py-3">
                <TransformEditor
                    entity={selected}
                    disabled={editor.mode !== 'edit'}
                    onCommit={(reason) => editor.commitFromCurrentEditScene(reason)}
                />
            </div>
        </div>
    );
}
