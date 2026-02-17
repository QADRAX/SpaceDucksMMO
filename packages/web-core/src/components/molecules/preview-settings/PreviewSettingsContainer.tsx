'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';

type Props = {
    label?: string;
    trigger?: React.ReactNode;
    children: React.ReactNode;
};

export function PreviewSettingsContainer({ label = 'Preview settings', trigger, children }: Props) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <div className="absolute top-3 right-3 flex items-center gap-2">
                {trigger ? (
                    <div onClick={() => setOpen(true)}>{trigger}</div>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setOpen(true)}
                    >
                        {label}
                    </Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 w-full max-w-2xl bg-white rounded-lg shadow-xl outline-none">
                    <div className="p-6 border-b border-border bg-neutral-50 rounded-t-lg">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xl font-heading font-bold text-neutral-900">{label}</div>
                                <div className="text-sm text-neutral-500 mt-1">
                                    Adjust visual settings for this preview (saved locally)
                                </div>
                            </div>
                            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                            {children}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
