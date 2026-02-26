import * as React from 'react';
import type { DebugKind } from '@duckengine/core';
import { EntityDebugDropdown } from '@/components/molecules/EntityDebugDropdown';
import { cn } from '@/lib/utils';

interface HierarchyItemProps {
    id: string;
    depth: number;
    label: string;
    labelIsId?: boolean;
    selected: boolean;
    hasChildren: boolean;
    expanded: boolean;
    gizmoIcon?: string;

    /** List of debug kinds currently enabled for this entity. */
    enabledDebugs: DebugKind[];
    /** List of debug kinds available for this entity based on its components. */
    availableDebugs: Array<{ kind: DebugKind; label: string; icon: React.ComponentType<any> }>;
    /** Callback to toggle a specific debug kind. */
    onToggleDebug: (kind: DebugKind) => void;

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

    const showDebugMenu = props.availableDebugs.length > 0;

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

            {showDebugMenu ? (
                <EntityDebugDropdown
                    id={props.id}
                    enabledDebugs={props.enabledDebugs}
                    availableDebugs={props.availableDebugs}
                    onToggleDebug={props.onToggleDebug}
                    align="right"
                />
            ) : null}
        </div>
    );
}
