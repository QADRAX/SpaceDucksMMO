import * as React from 'react';
import type { Entity } from '@duckengine/ecs';
import { useSceneEditorContext } from '../../SceneEditorContext';
import { HierarchyItem } from './HierarchyItem';
import { useHierarchyContext } from './HierarchyContext';
import {
    DebugTransformIcon,
    DebugMeshIcon,
    DebugColliderIcon,
    CameraIcon
} from '@/components/icons';

interface EntityNodeProps {
    entity: Entity;
    depth: number;
}

export function EntityNode(props: EntityNodeProps) {
    const { entity } = props;
    const editor = useSceneEditorContext();
    const {
        isExpanded,
        toggleExpanded,
        dragOverId,
        setDragOverId,
        handleDropToParent
    } = useHierarchyContext();

    const displayName = (entity.displayName && entity.displayName.trim()) ? entity.displayName.trim() : '';
    const label = displayName ? displayName : entity.id;
    const labelIsId = !displayName;
    const children = entity.getChildren();
    const hasChildren = children.length > 0;
    const expanded = isExpanded(entity.id);
    const selected = editor.selectedId === entity.id;

    const hasGeometry = entity.getAllComponents().some((c: any) => String(c.type).endsWith('Geometry') || String(c.type) === 'fullMesh');
    const hasCollider = entity.getAllComponents().some((c: any) => String(c.type).toLowerCase().includes('collider'));
    const hasCamera = entity.hasComponent('cameraView' as any);
    const canDragDrop = editor.mode === 'edit';

    const availableDebugs: Array<{ kind: any; label: string; icon: React.ComponentType<any> }> = [
        { kind: 'transform', label: 'Transform', icon: DebugTransformIcon },
    ];

    if (hasGeometry) {
        availableDebugs.push({ kind: 'mesh', label: 'Mesh', icon: DebugMeshIcon });
    }
    if (hasCollider) {
        availableDebugs.push({ kind: 'collider', label: 'Collider', icon: DebugColliderIcon });
    }
    if (hasCamera) {
        availableDebugs.push({ kind: 'camera', label: 'Camera', icon: CameraIcon });
    }

    const enabledDebugs = entity.getEnabledDebugs();

    return (
        <div>
            <HierarchyItem
                id={entity.id}
                depth={props.depth}
                label={label}
                labelIsId={labelIsId}
                selected={selected}
                hasChildren={hasChildren}
                expanded={expanded}
                gizmoIcon={entity.gizmoIcon}
                availableDebugs={availableDebugs}
                enabledDebugs={enabledDebugs}
                onToggleDebug={(kind) => editor.onToggleEntityDebug(entity.id, kind)}
                onToggle={hasChildren ? () => toggleExpanded(entity.id) : undefined}
                onSelect={() => editor.setSelectedId(entity.id)}
                draggable={canDragDrop}
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', entity.id);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                droppable={canDragDrop}
                dragOver={dragOverId === entity.id}
                onDragOver={() => setDragOverId(entity.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDropToParent(entity.id, e)}
            />

            {hasChildren && expanded ? (
                <div className="mt-1 space-y-1">
                    {children.map((c) => (
                        <EntityNode
                            key={c.id}
                            entity={c}
                            depth={props.depth + 1}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
