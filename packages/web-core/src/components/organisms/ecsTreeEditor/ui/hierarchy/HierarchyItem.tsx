import * as React from 'react';
import { DebugColliderIcon, DebugMeshIcon, DebugTransformIcon } from '@/components/icons';

interface HierarchyItemProps {
    id: string;
    depth: number;
    label: string;
    labelIsId?: boolean;
    selected: boolean;
    hasChildren: boolean;
    expanded: boolean;
    gizmoIcon?: string;
    debugTransformEnabled?: boolean;
    debugMeshEnabled?: boolean;
    debugColliderEnabled?: boolean;
    showDebugMesh?: boolean;
    showDebugCollider?: boolean;
    onToggleDebugTransform?: () => void;
    onToggleDebugMesh?: () => void;
    onToggleDebugCollider?: () => void;
    onToggle?: () => void;
    onSelect: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    droppable?: boolean;
    dragOver?: boolean;
    onDragOver?: () => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
}

export function HierarchyItem(props: HierarchyItemProps) {
    const indent = props.depth * 12;
    const gizmo = (props.gizmoIcon ?? '').trim();

    const showAnyDebug =
        !!props.onToggleDebugTransform ||
        (!!props.showDebugMesh && !!props.onToggleDebugMesh) ||
        (!!props.showDebugCollider && !!props.onToggleDebugCollider);

    return (
        <div
            className={
                'flex items-center gap-1 rounded-base border px-2 py-1 text-sm ' +
                (props.selected
                    ? 'bg-neutral-100 border-border'
                    : props.dragOver
                        ? 'bg-main border-border'
                        : 'bg-white border-transparent hover:border-border')
            }
            style={{ marginLeft: indent }}
            draggable={props.draggable}
            onDragStart={props.onDragStart}
            onClick={(e) => {
                e.stopPropagation();
                props.onSelect();
            }}
            onDragOver={(e) => {
                if (!props.droppable) return;
                e.preventDefault();
                props.onDragOver?.();
            }}
            onDragLeave={() => props.onDragLeave?.()}
            onDrop={(e) => props.onDrop?.(e)}
        >
            {props.hasChildren ? (
                <button
                    type="button"
                    className="w-6 text-xs opacity-70"
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onToggle?.();
                    }}
                    aria-label={props.expanded ? 'Collapse' : 'Expand'}
                >
                    <span className={props.expanded ? 'transition-transform' : '-rotate-90 transition-transform'}>▾</span>
                </button>
            ) : (
                <div className="w-6" />
            )}

            <div className="w-5 text-center text-xs opacity-80" aria-hidden>
                {gizmo || ''}
            </div>

            <div className={props.labelIsId ? 'flex-1 text-left font-mono text-xs font-normal opacity-80' : 'flex-1 text-left'}>
                {props.label}
            </div>

            {showAnyDebug ? (
                <div className="ml-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {props.onToggleDebugTransform ? (
                        <button
                            type="button"
                            className={
                                'flex h-6 w-6 items-center justify-center rounded-base border border-transparent hover:bg-gray-100 ' +
                                (props.debugTransformEnabled ? 'bg-gray-100' : '')
                            }
                            aria-label={props.debugTransformEnabled ? 'Disable transform debug' : 'Enable transform debug'}
                            title="Debug transform"
                            onClick={props.onToggleDebugTransform}
                        >
                            <DebugTransformIcon className="h-4 w-4" />
                        </button>
                    ) : null}

                    {props.showDebugMesh && props.onToggleDebugMesh ? (
                        <button
                            type="button"
                            className={
                                'flex h-6 w-6 items-center justify-center rounded-base border border-transparent hover:bg-gray-100 ' +
                                (props.debugMeshEnabled ? 'bg-gray-100' : '')
                            }
                            aria-label={props.debugMeshEnabled ? 'Disable mesh debug' : 'Enable mesh debug'}
                            title="Debug mesh"
                            onClick={props.onToggleDebugMesh}
                        >
                            <DebugMeshIcon className="h-4 w-4" />
                        </button>
                    ) : null}

                    {props.showDebugCollider && props.onToggleDebugCollider ? (
                        <button
                            type="button"
                            className={
                                'flex h-6 w-6 items-center justify-center rounded-base border border-transparent hover:bg-gray-100 ' +
                                (props.debugColliderEnabled ? 'bg-gray-100' : '')
                            }
                            aria-label={props.debugColliderEnabled ? 'Disable collider debug' : 'Enable collider debug'}
                            title="Debug collider"
                            onClick={props.onToggleDebugCollider}
                        >
                            <DebugColliderIcon className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
