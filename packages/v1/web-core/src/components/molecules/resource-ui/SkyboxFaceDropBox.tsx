'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export type FaceSlot = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

export const FACE_SLOTS: readonly FaceSlot[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

export const FACE_HINTS: Record<FaceSlot, { title: string; suffixes: string }> = {
    px: { title: 'Right (+X)', suffixes: 'rt, right, posx, px' },
    nx: { title: 'Left (-X)', suffixes: 'lf, left, negx, nx' },
    py: { title: 'Up (+Y)', suffixes: 'up, top, posy, py' },
    ny: { title: 'Down (-Y)', suffixes: 'dn, down, bottom, negy, ny' },
    // Note: Three.js default camera looks down -Z, so "front" from a viewer perspective is -Z.
    nz: { title: 'Front (-Z)', suffixes: 'ft, front, negz, nz' },
    pz: { title: 'Back (+Z)', suffixes: 'bk, back, posz, pz' },
};

function isImageFile(file: File): boolean {
    return typeof file?.type === 'string' && file.type.startsWith('image/');
}

export function SkyboxFaceDropBox({
    slot,
    file,
    previewUrl,
    onPick,
    onRotate,
}: {
    slot: FaceSlot;
    file: File | null;
    previewUrl: string | null;
    onPick: (slot: FaceSlot, file: File | null) => void;
    onRotate?: (slot: FaceSlot) => void;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [isOver, setIsOver] = React.useState(false);

    const hint = FACE_HINTS[slot];

    return (
        <div className="space-y-2">
            <div className="text-xs text-neutral-600">
                <span className="font-bold text-black">{slot.toUpperCase()}</span> — {hint.title}
            </div>

            <div
                role="button"
                tabIndex={0}
                className={cn(
                    'relative aspect-square w-full rounded-base border-2 border-dashed border-border bg-white shadow-base overflow-hidden select-none',
                    isOver ? 'outline-2 outline-border' : ''
                )}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsOver(true);
                }}
                onDragLeave={() => setIsOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsOver(false);
                    const f = e.dataTransfer?.files?.[0] ?? null;
                    if (!f) return;
                    if (!isImageFile(f)) return;
                    onPick(slot, f);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPick(slot, e.target.files?.[0] ?? null)}
                />

                {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={`${slot} face`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                        <div className="text-xs text-neutral-600">
                            Drop image here or click to select
                        </div>
                    </div>
                )}

                {file && (slot === 'py' || slot === 'ny') && onRotate ? (
                    <div className="absolute top-2 left-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRotate(slot);
                            }}
                        >
                            Rotate 90°
                        </Button>
                    </div>
                ) : null}

                <div className="absolute left-2 bottom-2 right-2">
                    <div className="bg-white/90 border border-border rounded-base px-2 py-1 text-[11px]">
                        <div className="truncate">{file ? file.name : 'No file'}</div>
                    </div>
                </div>
            </div>

            <div className="text-[11px] text-neutral-600">
                Common suffixes: <span className="font-mono">{hint.suffixes}</span>
            </div>
        </div>
    );
}
