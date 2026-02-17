'use client';

import * as React from 'react';

type Props = {
    label?: string;
    labels?: [string, string, string];
    value: { x: number; y: number; z: number } | [number, number, number];
    onChange: (value: { x: number; y: number; z: number }) => void;
    step?: number;
};

export function PreviewSettingVector3({ label, labels = ['X', 'Y', 'Z'], value, onChange, step = 0.1 }: Props) {
    const x = Array.isArray(value) ? value[0] : value.x;
    const y = Array.isArray(value) ? value[1] : value.y;
    const z = Array.isArray(value) ? value[2] : value.z;

    const handleChange = (axis: 'x' | 'y' | 'z', val: number) => {
        onChange({ x: axis === 'x' ? val : x, y: axis === 'y' ? val : y, z: axis === 'z' ? val : z });
    };

    return (
        <div>
            {label && <div className="text-xs font-bold text-neutral-900 mb-2">{label}</div>}
            <div className="grid grid-cols-3 gap-2">
                {(['x', 'y', 'z'] as const).map((axis, i) => (
                    <label key={axis} className="flex flex-col gap-1">
                        <span className="text-[10px] lowercase text-neutral-500 font-bold tracking-wider">{labels[i]}</span>
                        <input
                            type="number"
                            step={step}
                            value={axis === 'x' ? x : axis === 'y' ? y : z}
                            onChange={(e) => handleChange(axis, Number(e.target.value))}
                            className="w-full bg-white border border-border rounded px-2 py-1 text-xs tabular-nums focus:border-neutral-500 focus:outline-none transition-colors"
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}
