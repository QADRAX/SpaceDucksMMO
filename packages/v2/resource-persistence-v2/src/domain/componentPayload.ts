import { CUSTOM_SHADER_RESOURCE_KINDS } from '@duckengine/core-v2';
import type { ResourceKind } from '@duckengine/core-v2';

import {
  AnimationClipComponentDataSchema,
  EmptyStrictComponentDataSchema,
  MaterialComponentSchema,
  MaterialComponentTypeSchema,
  MeshComponentDataSchema,
  ShaderMaterialComponentDataSchema,
} from './validation/schemas';

/**
 * Resource kinds that use {@link import('@duckengine/core-v2').ShaderMaterialFileSlots} (vertex + fragment sources).
 * Derived from {@link CUSTOM_SHADER_RESOURCE_KINDS} in core — not duplicated by name.
 */
export const CUSTOM_SHADER_RESOURCE_KIND_SET = new Set<string>(CUSTOM_SHADER_RESOURCE_KINDS);

export function coerceComponentData(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

export function parseComponentPayloadForKind(
  kind: ResourceKind,
  componentDataObj: unknown
): { success: true; data: { componentData: Record<string, unknown> } } | { success: false } {
  const materialKind = MaterialComponentTypeSchema.safeParse(kind);
  if (materialKind.success) {
    const componentDataCoerced = coerceComponentData(componentDataObj);
    const r = MaterialComponentSchema.safeParse({
      componentType: materialKind.data,
      componentData: componentDataCoerced,
    });
    if (!r.success) return { success: false };
    return {
      success: true,
      data: { componentData: (r.data.componentData ?? {}) as Record<string, unknown> },
    };
  }

  if (CUSTOM_SHADER_RESOURCE_KIND_SET.has(kind)) {
    const componentDataCoerced = coerceComponentData(componentDataObj);
    const r = ShaderMaterialComponentDataSchema.safeParse(componentDataCoerced);
    if (!r.success) return { success: false };
    return { success: true, data: { componentData: r.data as Record<string, unknown> } };
  }

  if (kind === 'mesh') {
    const r = MeshComponentDataSchema.safeParse(coerceComponentData(componentDataObj));
    if (!r.success) return { success: false };
    return { success: true, data: { componentData: r.data as Record<string, unknown> } };
  }

  if (kind === 'animationClip') {
    const r = AnimationClipComponentDataSchema.safeParse(coerceComponentData(componentDataObj));
    if (!r.success) return { success: false };
    return { success: true, data: { componentData: r.data as Record<string, unknown> } };
  }

  if (kind === 'script' || kind === 'texture' || kind === 'skybox') {
    const r = EmptyStrictComponentDataSchema.safeParse(coerceComponentData(componentDataObj));
    if (!r.success) return { success: false };
    return { success: true, data: { componentData: r.data as Record<string, unknown> } };
  }

  return { success: false };
}
