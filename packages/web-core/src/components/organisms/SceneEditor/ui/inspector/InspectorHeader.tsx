import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { DebugTransformIcon, DebugMeshIcon, DebugColliderIcon } from '@/components/icons';
import { useSceneEditorContext } from '../../SceneEditorContext';

interface InspectorHeaderProps {
    selected: any; // Using any for Entity as per original file usage, ideal to type properly if possible
    editor: ReturnType<typeof useSceneEditorContext>;
}

export function InspectorHeader({ selected, editor }: InspectorHeaderProps) {
    const selectedSubtitle = (() => {
        if (!selected) return 'No selection';
        const dn = selected.displayName;
        if (typeof dn === 'string' && dn.trim()) return dn.trim();
        return selected.id;
    })();

    return (
        <div className="border-b border-border p-2">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-bold">Inspector</div>
                    <div className="text-xs text-muted-foreground">{selectedSubtitle}</div>
                </div>

                {selected && editor.mode === 'edit' ? (
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            aria-label={selected.isDebugTransformEnabled() ? 'Disable transform debug' : 'Enable transform debug'}
                            title="Debug transform"
                            onClick={() => editor.onToggleEntityDebugTransform(selected.id)}
                            className={selected.isDebugTransformEnabled() ? 'bg-gray-100' : undefined}
                        >
                            <DebugTransformIcon className="h-4 w-4" />
                        </Button>

                        {selected.getAllComponents().some((c: any) => String(c.type).endsWith('Geometry') || String(c.type) === 'fullMesh') ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="iconSm"
                                aria-label={selected.isDebugMeshEnabled() ? 'Disable mesh debug' : 'Enable mesh debug'}
                                title="Debug mesh"
                                onClick={() => editor.onToggleEntityDebugMesh(selected.id)}
                                className={selected.isDebugMeshEnabled() ? 'bg-gray-100' : undefined}
                            >
                                <DebugMeshIcon className="h-4 w-4" />
                            </Button>
                        ) : null}

                        {selected.getAllComponents().some((c: any) => String(c.type).toLowerCase().includes('collider')) ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="iconSm"
                                aria-label={selected.isDebugColliderEnabled() ? 'Disable collider debug' : 'Enable collider debug'}
                                title="Debug collider"
                                onClick={() => editor.onToggleEntityDebugCollider(selected.id)}
                                className={selected.isDebugColliderEnabled() ? 'bg-gray-100' : undefined}
                            >
                                <DebugColliderIcon className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
