'use client';

import * as React from 'react';
import type { DebugKind } from '@duckengine/core';
import {
    EyeIcon,
    DebugTransformIcon,
    DebugMeshIcon,
    DebugColliderIcon,
    CameraIcon
} from '@/components/icons';
import { DropdownMenu } from '@/components/molecules/DropdownMenu';
import { cn } from '@/lib/utils';

export interface DebugOption {
    kind: DebugKind;
    label: string;
    icon: React.ComponentType<any>;
}

interface EntityDebugDropdownProps {
    id: string;
    enabledDebugs: DebugKind[];
    availableDebugs: DebugOption[];
    onToggleDebug: (kind: DebugKind) => void;
    align?: 'left' | 'right';
}

export function EntityDebugDropdown({
    id,
    enabledDebugs,
    availableDebugs,
    onToggleDebug,
    align = 'right'
}: EntityDebugDropdownProps) {
    const activeCount = enabledDebugs.length;
    const hasActive = activeCount > 0;

    return (
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
                align={align}
                closeOnSelect={false}
                trigger={
                    <button
                        type="button"
                        className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-base border border-transparent hover:bg-gray-100 transition-colors',
                            hasActive ? 'text-main-600' : 'text-neutral-400'
                        )}
                        title="Debug visualizations"
                    >
                        <EyeIcon className="h-4 w-4" />
                    </button>
                }
            >
                <div className="flex flex-col p-1 min-w-[140px]">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase opacity-50">Debug Flags</div>
                    {availableDebugs.map(({ kind, label, icon: Icon }) => {
                        const enabled = enabledDebugs.includes(kind);
                        return (
                            <button
                                key={kind}
                                type="button"
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-base px-2 py-1.5 text-xs text-left transition-colors font-bold border-none cursor-pointer',
                                    enabled ? 'bg-gray-100' : 'bg-transparent hover:bg-gray-50'
                                )}
                                onClick={() => onToggleDebug(kind)}
                            >
                                <div className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-base border',
                                    enabled ? 'bg-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-transparent border-transparent'
                                )}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="flex-1">{label}</span>
                                {enabled && (
                                    <div className="h-2 w-2 rounded-full bg-black ml-auto ring-1 ring-white" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </DropdownMenu>
        </div>
    );
}
