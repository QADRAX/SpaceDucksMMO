'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { DropdownMenu, DropdownMenuItem } from '@/components/molecules/DropdownMenu';
import {
  BoxIcon,
  CameraIcon,
  CircleIcon,
  CodeIcon,
  CrosshairIcon,
  CylinderIcon,
  File3dIcon,
  FullMeshIcon,
  FilterIcon,
  FlashlightIcon,
  Gamepad2Icon,
  Grid3x3Icon,
  LightbulbIcon,
  MousePointerIcon,
  PaintBucketIcon,
  PaletteIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareIcon,
  SunIcon,
  TagIcon,
  TargetIcon,
  TriangleIcon,
  ZapIcon,
  ArrowDownIcon,
} from '@/components/icons';

interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  icon: string;
}

interface ComponentSelectorProps {
  components: ComponentDefinition[];
  onSelect: (componentType: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

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

const categoryOrder = [
  'Identity',
  'Camera',
  'Movement & Controls',
  'Physics',
  'Lighting',
  'Rendering',
  'Behavior',
];

export function ComponentSelector({
  components,
  onSelect,
  disabled = false,
  placeholder = 'Add component...',
}: ComponentSelectorProps) {
  // Group components by category
  const groupedComponents = React.useMemo(() => {
    const groups: Record<string, ComponentDefinition[]> = {};

    components.forEach((component) => {
      const category = component.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(component);
    });

    // Sort categories according to predefined order
    const sortedGroups: Record<string, ComponentDefinition[]> = {};
    categoryOrder.forEach((category) => {
      if (groups[category]) {
        sortedGroups[category] = groups[category].sort((a, b) => a.label.localeCompare(b.label));
      }
    });

    // Add any remaining categories not in the predefined order
    Object.keys(groups).forEach((category) => {
      if (!sortedGroups[category]) {
        sortedGroups[category] = groups[category].sort((a, b) => a.label.localeCompare(b.label));
      }
    });

    return sortedGroups;
  }, [components]);

  const renderIcon = (iconName: unknown) => {
    if (typeof iconName !== 'string' || !iconName) return null;
    const Icon = iconMap[iconName as keyof typeof iconMap];
    if (!Icon) return null;
    return <Icon className="h-4 w-4 shrink-0" />;
  };

  const trigger = (
    <Button type="button" variant="secondary" size="sm" disabled={disabled}>
      {placeholder}
    </Button>
  );

  if (disabled) return trigger;

  return (
    <DropdownMenu trigger={trigger} align="right">
      <div className="max-h-80 overflow-y-auto scrollbar">
        {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
          <div key={category} className="py-1">
            <div className="px-4 py-1 text-xs uppercase tracking-wide text-neutral-600">{category}</div>
            {categoryComponents.map((component) => (
              <DropdownMenuItem key={component.type} onClick={() => onSelect(component.type)} className="font-bold">
                <div className="flex items-center gap-2">
                  {renderIcon(component.icon)}
                  <div className="truncate">{component.label}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </div>
    </DropdownMenu>
  );
}
