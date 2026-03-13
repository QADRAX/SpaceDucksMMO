'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    fullscreen?: boolean;
};

export function ResourceDialogLayout({
    open,
    onOpenChange,
    title,
    subtitle,
    onClose,
    children,
    className,
    fullscreen = true,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullscreen={fullscreen} className={cn("bg-white", className)}>
                <div className="flex h-full w-full flex-col">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-neutral-600">{subtitle ?? 'Create'}</div>
                            <div className="text-xl font-heading">{title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1">
                        {children}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ResourceDialogFormPanel({ children, onSubmit, error, className }: { children: React.ReactNode, onSubmit?: (e: React.FormEvent) => void, error?: string | null, className?: string }) {
    return (
        <div className={cn("w-full max-w-xl border-r border-border overflow-auto scrollbar p-6", className)}>
            <form className="space-y-6" onSubmit={onSubmit}>
                {error && (
                    <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                {children}
            </form>
        </div>
    );
}

export function ResourceDialogPreviewPanel({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("min-w-0 flex-1 bg-bg", className)}>
            {children}
        </div>
    );
}
