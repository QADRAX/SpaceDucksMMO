'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    children: React.ReactNode;
    className?: string;
};

export function PreviewSettingGroup({ title, children, className }: Props) {
    return (
        <div className={cn('space-y-4', className)}>
            <div className="font-bold text-neutral-900 border-b border-border pb-1 mb-3">{title}</div>
            <div className="space-y-3 pl-1">
                {children}
            </div>
        </div>
    );
}
