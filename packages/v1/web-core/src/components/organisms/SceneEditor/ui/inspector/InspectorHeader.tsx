import * as React from 'react';
import type { DebugKind } from '@duckengine/core';
import { Button } from '@/components/atoms/Button';
import { DebugTransformIcon, DebugMeshIcon, DebugColliderIcon, CameraIcon } from '@/components/icons';
import { EntityDebugDropdown } from '@/components/molecules/EntityDebugDropdown';
import { cn } from '@/lib/utils';
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
                        <EntityDebugDropdown
                            id={selected.id}
                            enabledDebugs={selected.getEnabledDebugs()}
                            availableDebugs={(() => {
                                const available: any[] = [
                                    { kind: 'transform', label: 'Transform', icon: DebugTransformIcon },
                                ];
                                if (selected.getAllComponents().some((c: any) => String(c.type).endsWith('Geometry') || String(c.type) === 'fullMesh')) {
                                    available.push({ kind: 'mesh', label: 'Mesh', icon: DebugMeshIcon });
                                }
                                if (selected.getAllComponents().some((c: any) => String(c.type).toLowerCase().includes('collider'))) {
                                    available.push({ kind: 'collider', label: 'Collider', icon: DebugColliderIcon });
                                }
                                if (selected.hasComponent('cameraView')) {
                                    available.push({ kind: 'camera', label: 'Camera', icon: CameraIcon });
                                }
                                return available;
                            })()}
                            onToggleDebug={(kind: DebugKind) => editor.onToggleEntityDebug(selected.id, kind)}
                            align="right"
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
