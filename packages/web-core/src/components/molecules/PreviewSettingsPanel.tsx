'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onReset?: () => void;
    children: React.ReactNode;
};

export function PreviewSettingsPanel({
    open,
    onOpenChange,
    title = 'Preview settings',
    description = 'Saved locally per resource',
    onReset,
    children,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 w-full max-w-2xl bg-white">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xl font-heading">{title}</div>
                            <div className="text-sm text-neutral-600 mt-1">{description}</div>
                        </div>
                        <Button type="button" size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-6 text-sm">{children}</div>

                    <div className="flex items-center justify-between gap-2 pt-6 mt-6 border-t border-border">
                        {onReset ? (
                            <Button type="button" size="sm" variant="secondary" onClick={onReset}>
                                Reset to defaults
                            </Button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
