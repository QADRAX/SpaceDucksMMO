import type { ComponentBase } from './types';
import type { ComponentByType, ComponentCreateOverride, CreatableComponentType } from './types/factory';
import { createComponent } from './factory';
import type { Transform3dComponent } from './types/transform';
import type { Transform2dComponent } from './types/ui';

/** Runtime pose fields that must not be copied as plain override bags. */
const TRANSFORM3D_RUNTIME_KEYS = new Set([
  'localPosition',
  'localRotation',
  'localScale',
  'worldPosition',
  'worldRotation',
  'worldScale',
  'dirty',
  'parent',
  'parentCb',
  'changeCbs',
]);

const TRANSFORM2D_RUNTIME_KEYS = new Set([
  'localPosition',
  'localSize',
  'localRotation',
  'localScale',
  'anchor',
  'pivot',
  'zIndex',
  'dirty',
  'parent',
]);

const NON_CLONEABLE_KEYS = new Set<string>([
  'type',
  'metadata',
  'enabled',
  ...TRANSFORM3D_RUNTIME_KEYS,
  ...TRANSFORM2D_RUNTIME_KEYS,
]);

/**
 * Extracts cloneable data from a component (all fields except type, metadata, enabled).
 * Returns strongly-typed override data suitable for createComponent.
 * transform3d pose is re-created via position/rotation/scale overrides.
 */
export function extractComponentData<T extends CreatableComponentType>(
  comp: ComponentByType[T],
): ComponentCreateOverride<T> {
  if (comp.type === 'transform3d') {
    const t = comp as Transform3dComponent;
    return {
      position: { ...t.localPosition },
      rotation: { ...t.localRotation },
      scale: { ...t.localScale },
    } as ComponentCreateOverride<T>;
  }
  if (comp.type === 'transform2d') {
    const t = comp as Transform2dComponent;
    return {
      position: { ...t.localPosition },
      size: { ...t.localSize },
      rotation: t.localRotation,
      scale: { ...t.localScale },
      anchor: { ...t.anchor },
      pivot: { ...t.pivot },
      zIndex: t.zIndex,
    } as ComponentCreateOverride<T>;
  }
  const result: Partial<Omit<ComponentByType[T], 'type' | 'metadata' | 'enabled'>> = {};
  const compRecord = comp as unknown as Record<string, unknown>;
  for (const key of Object.keys(compRecord)) {
    if (NON_CLONEABLE_KEYS.has(key)) continue;
    const val = compRecord[key];
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result as ComponentCreateOverride<T>;
}

/**
 * Clones a component by creating a new instance with the same data and enabled state.
 */
export function cloneComponent(comp: ComponentBase): ComponentBase {
  if (comp.type === 'transform3d') {
    const src = comp as Transform3dComponent;
    const cloned = createComponent('transform3d', {
      position: { ...src.localPosition },
      rotation: { ...src.localRotation },
      scale: { ...src.localScale },
    });
    cloned.enabled = src.enabled ?? true;
    return cloned;
  }
  if (comp.type === 'transform2d') {
    const src = comp as Transform2dComponent;
    const cloned = createComponent('transform2d', {
      position: { ...src.localPosition },
      size: { ...src.localSize },
      rotation: src.localRotation,
      scale: { ...src.localScale },
      anchor: { ...src.anchor },
      pivot: { ...src.pivot },
      zIndex: src.zIndex,
    });
    cloned.enabled = src.enabled ?? true;
    return cloned;
  }
  const type = comp.type as CreatableComponentType;
  const data = extractComponentData(comp as ComponentByType[typeof type]);
  const cloned = createComponent(type, data) as ComponentBase;
  cloned.enabled = comp.enabled ?? true;
  return cloned;
}
