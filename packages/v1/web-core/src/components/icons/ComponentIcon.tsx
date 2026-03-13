import * as React from 'react';
import {
    TagIcon,
    CameraIcon,
    Gamepad2Icon,
    MousePointerIcon,
    RotateCcwIcon,
    ZapIcon,
    ArrowDownIcon,
    SunIcon,
    LightbulbIcon,
    FlashlightIcon,
    BoxIcon,
    CircleIcon,
    SquareIcon,
    CylinderIcon,
    TriangleIcon,
    File3dIcon,
    FullMeshIcon,
    PaletteIcon,
    PaintBucketIcon,
    SparklesIcon,
    Grid3x3Icon,
    CodeIcon,
    FilterIcon,
    CrosshairIcon,
    TargetIcon,
} from './index';

const iconMap = {
    Tag: TagIcon,
    Camera: CameraIcon,
    Gamepad2: Gamepad2Icon,
    MousePointer: MousePointerIcon,
    RotateCcw: RotateCcwIcon,
    Zap: ZapIcon,
    ArrowDown: ArrowDownIcon,
    Sun: SunIcon,
    Lightbulb: LightbulbIcon,
    Flashlight: FlashlightIcon,
    Box: BoxIcon,
    Circle: CircleIcon,
    Square: SquareIcon,
    Cylinder: CylinderIcon,
    Triangle: TriangleIcon,
    File3d: File3dIcon,
    FullMesh: FullMeshIcon,
    Palette: PaletteIcon,
    PaintBucket: PaintBucketIcon,
    Sparkles: SparklesIcon,
    Grid3x3: Grid3x3Icon,
    Code: CodeIcon,
    Filter: FilterIcon,
    Crosshair: CrosshairIcon,
    Target: TargetIcon,
} as const;

export function getComponentIcon(iconName: string) {
    const Icon = iconMap[iconName as keyof typeof iconMap];
    return Icon || null;
}

interface ComponentIconProps extends React.ComponentProps<'svg'> {
    icon: unknown;
}

export function ComponentIcon({ icon, className, ...props }: ComponentIconProps) {
    if (typeof icon !== 'string' || !icon) return null;
    const Icon = getComponentIcon(icon);
    if (!Icon) return null;
    return <Icon className={className || "h-4 w-4 shrink-0"} {...props} />;
}
