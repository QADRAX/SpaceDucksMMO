import React from "react";

export const ALL_MAGNITUDES = [100000, 10000, 1000, 100, 10, 1, 0.1, 0.01, 0.001, 0.0001, 0.00001];

interface MagnitudeGaugeProps {
    activeMagnitude: number;
    isVisible: boolean;
}

/**
 * A compact, premium sliding scale gauge that visualizes the current step magnitude.
 * Uses glassmorphism and smooth transitons to convey a "shifting gears" metaphor.
 */
export function MagnitudeGauge({ activeMagnitude, isVisible }: MagnitudeGaugeProps) {
    if (!isVisible) return null;

    const activeIndex = ALL_MAGNITUDES.indexOf(activeMagnitude);
    const ITEM_HEIGHT = 20; // More compact than before

    return (
        <div className="pointer-events-none absolute -top-16 left-1/2 z-50 flex h-14 w-12 -translate-x-1/2 flex-col items-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900/90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in zoom-in slide-in-from-bottom-1 duration-300">
            <div
                className="flex flex-col items-center gap-1 py-6 transition-transform duration-300 ease-out"
                style={{ transform: `translateY(${-(activeIndex * (ITEM_HEIGHT + 4)) + 2}px)` }}
            >
                {ALL_MAGNITUDES.map((m) => (
                    <div
                        key={m}
                        className={`flex h-5 items-center text-[8px] font-bold transition-all duration-300 ${m === activeMagnitude ? 'scale-110 text-white' : 'scale-90 text-neutral-600 opacity-20'
                            }`}
                    >
                        {m}
                    </div>
                ))}
            </div>

            {/* Lens focus bar - more subtle */}
            <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 border-y border-white/10 bg-white/5" />

            {/* Compact Header */}
            <div className="absolute top-0.5 text-[6px] font-black tracking-widest text-white/30 uppercase select-none">
                Step
            </div>
        </div>
    );
}
