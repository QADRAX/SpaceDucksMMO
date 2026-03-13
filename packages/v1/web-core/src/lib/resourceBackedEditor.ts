import type { Entity, Component } from '@duckengine/core';
import {
  isMaterialComponent,
  MATERIAL_RESOURCE_REF_KEY,
  MATERIAL_RESOURCE_KINDS,
  type MaterialResourceKind,
  type MaterialResourceRef,
  type AnyMaterialComponent,
} from '@duckengine/core';

import type { EcsEditorScene } from '@/components/organisms/SceneEditor/logic/EcsEditorScene';
import { applyComponentDataWithInspector } from '@/lib/ecs-snapshot';
import { resolveMaterialResourceActive } from '@/lib/engineResourceResolution';

// Re-export for compatibility if needed, or just use from ECS
export { MATERIAL_RESOURCE_REF_KEY, type MaterialResourceRef };

export const MATERIAL_COMPONENT_TYPES = MATERIAL_RESOURCE_KINDS;

export function isMaterialComponentType(type: string): type is MaterialResourceKind {
  return (MATERIAL_RESOURCE_KINDS as string[]).includes(type);
}

function getAllEntities(scene: EcsEditorScene): Entity[] {
  return Array.from(scene.getEntitiesById().values());
}

export async function hydrateResourceBackedMaterials(scene: EcsEditorScene): Promise<void> {
  const compsByKey = new Map<string, Array<{ comp: Component; type: MaterialResourceKind }>>();

  for (const ent of getAllEntities(scene)) {
    const comps = ent.getAllComponents();
    for (const c of comps) {
      if (!isMaterialComponent(c)) continue;

      const type = c.type as MaterialResourceKind;
      // Access property safely via unknown cast first if needed, or better, direct access if we extend the type.
      // Since $resourceKey is runtime dynamic editor data, we cast to unknown first.
      const rawKey = (c as unknown as MaterialResourceRef)[MATERIAL_RESOURCE_REF_KEY];
      const key = typeof rawKey === 'string' ? rawKey : '';

      if (!key.trim()) continue;

      const list = compsByKey.get(key) ?? [];
      list.push({ comp: c, type });
      compsByKey.set(key, list);
    }
  }

  if (compsByKey.size === 0) return;

  const resolvedByKey = new Map<string, { kind: MaterialResourceKind; componentData: Record<string, unknown> }>();

  await Promise.all(
    Array.from(compsByKey.keys()).map(async (key) => {
      try {
        const resolved = await resolveMaterialResourceActive(key);
        resolvedByKey.set(key, resolved);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[hydrateResourceBackedMaterials] Failed to resolve resource '${key}'`, e);
        }
      }
    })
  );

  for (const [key, comps] of compsByKey.entries()) {
    const resolved = resolvedByKey.get(key);
    if (!resolved) continue;

    for (const { comp, type } of comps) {
      // Safety: only hydrate when the resource kind matches the component type.
      if (resolved.kind !== type) continue;

      // Prepare data by explicitly setting missing inspector fields to undefined.
      // This ensures that switching resources resets properties that the new resource doesn't define.
      // comp.metadata is strictly typed on Component.
      const fields = comp.metadata.inspector?.fields ?? [];
      const dataToApply = { ...resolved.componentData };

      for (const f of fields) {
        const key = String(f.key);
        if (!(key in dataToApply)) {
          dataToApply[key] = undefined;
        }
      }

      try {
        applyComponentDataWithInspector(comp, dataToApply);
      } catch (e) {
        console.warn(`[hydrateResourceBackedMaterials] Failed to apply data to component '${comp.type}' on entity '${(comp as any).entityId}'`, e);
      }
    }
  }
}
