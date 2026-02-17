'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';

type Props = {
    title: string;
    kindLabel?: string;
    activeVersion: number;
    totalVersions: number;
    onAction?: () => void;
    actionLabel?: string;
    children?: React.ReactNode;
};

export function ResourceDetailHeader({
    title,
    kindLabel,
    activeVersion,
    totalVersions,
    onAction,
    actionLabel = '+ Create / Upload',
    children,
}: Props) {
    return (
        <section className="shrink-0 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-heading">{title}</div>
                    <div className="text-xs text-neutral-600 mt-1">
                        {kindLabel && <span className="mr-2 uppercase tracking-wide font-bold text-neutral-400">{kindLabel}</span>}
                        Active: <span className="font-bold text-black">v{activeVersion}</span> · Total: {totalVersions}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {children}
                    {!children && onAction && (
                        <Button type="button" size="sm" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
