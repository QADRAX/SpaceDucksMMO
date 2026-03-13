'use client';

import * as React from 'react';

type Props = {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
};

export function PreviewSettingSlider({ label, value, onChange, min = 0, max = 100, step = 1 }: Props) {
    return (
        <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-600 font-medium">{label}</span>
                <span className="text-neutral-400 font-mono">{Number(value).toFixed(step < 0.1 ? 2 : 1)}</span>
            </div>
            <input
                type="range"
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}
