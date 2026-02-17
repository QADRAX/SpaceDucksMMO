export function clampNumber(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

export type BasePreviewSettings = {
    camera: {
        x?: number;
        y?: number;
        z?: number;
        radius?: number;
        height?: number;
        fov?: number;
    };
    rotation: {
        enabled: boolean;
        speed: number;
        axis?: 'x' | 'y' | 'z';
    };
};
