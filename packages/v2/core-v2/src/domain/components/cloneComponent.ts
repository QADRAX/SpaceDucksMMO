import type { ComponentBase } from './types';
import type { ComponentByType, ComponentCreateOverride, CreatableComponentType } from './types/factory';
import { createComponent } from './factory';

const NON_CLONEABLE_KEYS = new Set<keyof ComponentBase>(['type', 'metadata', 'enabled']);

/**
 * Extracts cloneable data from a component (all fields except type, metadata, enabled).
 * Returns strongly-typed override data suitable for createComponent.
 */
export function extractComponentData<T extends CreatableComponentType>(
  comp: ComponentByType[T],
): ComponentCreateOverride<T> {
  const result: Partial<Omit<ComponentByType[T], 'type' | 'metadata' | 'enabled'>> = {};
  const compRecord = comp as unknown as Record<string, unknown>;
  for (const key of Object.keys(compRecord)) {
    if (NON_CLONEABLE_KEYS.has(key as keyof ComponentBase)) continue;
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
  const type = comp.type as CreatableComponentType;
  const data = extractComponentData(comp as ComponentByType[typeof type]);
  return createComponent(type, { ...data, enabled: comp.enabled } as ComponentCreateOverride<typeof type>);
}
