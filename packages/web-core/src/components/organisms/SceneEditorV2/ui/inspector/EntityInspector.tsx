import * as React from 'react';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { EmojiPickerDialog } from '@/components/molecules/EmojiPickerDialog';
import { TransformEditor } from '@/components/molecules/TransformEditor';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { EditorPanelSlot } from '../../plugins/EditorPanelSlot';

interface EntityInspectorProps {
    selected: any;
    editor: ReturnType<typeof useSceneEditorV2Context>;
}

export function EntityInspector({ selected, editor }: EntityInspectorProps) {
    const selectedNameValue = selected?.displayName ?? '';
    const selectedGizmoIconValue = selected?.gizmoIcon ?? '';

    return (
        <div className="flex flex-col">
            <div className="border-b border-black/10 px-3 py-3">
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Name</Label>
                    <Input
                        className="border-2 border-black rounded-none"
                        value={selectedNameValue}
                        onChange={(e) => editor.onSetSelectedName(e.target.value)}
                        disabled={editor.gameState !== 'stopped'}
                    />
                </div>
            </div>

            <div className="border-b border-black/10 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Gizmo Icon</Label>
                    <EmojiPickerDialog
                        title="Choose gizmo icon"
                        value={selectedGizmoIconValue}
                        onChange={(next) => editor.onSetSelectedGizmoIcon(next)}
                        disabled={editor.gameState !== 'stopped'}
                        triggerAriaLabel="Choose gizmo icon"
                    />
                </div>
            </div>

            <div className="px-3 py-3">
                <TransformEditor
                    entity={selected}
                    disabled={editor.gameState !== 'stopped'}
                    onCommit={(reason) => editor.commitFromCurrentScene()}
                />
                <EditorPanelSlot slotId="inspector.after-transform" className="mt-3" />
            </div>
        </div>
    );
}
