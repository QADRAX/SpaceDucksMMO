import type { Entity } from '@duckengine/ecs';

import type { EcsEditorScene } from '@/lib/ecsTreeEditorRuntime';
import { applyComponentDataWithInspector } from '@/lib/ecsSnapshotRuntime';
import type { MaterialResourceKind } from '@/lib/types';
import { resolveMaterialResourceActive } from '@/lib/engineResourceResolution';

export const MATERIAL_RESOURCE_REF_KEY = '$resourceKey' as const;

export const MATERIAL_COMPONENT_TYPES: MaterialResourceKind[] = [
  'basicMaterial',
  'lambertMaterial',
  'phongMaterial',
  'standardMaterial',
];

export function isMaterialComponentType(type: string): type is MaterialResourceKind {
  return (MATERIAL_COMPONENT_TYPES as string[]).includes(type);
}

export type MaterialResourceRef = {
  [MATERIAL_RESOURCE_REF_KEY]?: string;
};

function getAllEntities(scene: EcsEditorScene): Entity[] {
  return Array.from(scene.getEntitiesById().values());
}

export async function hydrateResourceBackedMaterials(scene: EcsEditorScene): Promise<void> {
  const compsByKey = new Map<string, Array<{ comp: any; type: MaterialResourceKind }>>();

  for (const ent of getAllEntities(scene)) {
    const comps = ent.getAllComponents();
    for (const c of comps as any[]) {
      const type = String(c?.type ?? '');
      if (!isMaterialComponentType(type)) continue;
      const key = typeof c?.[MATERIAL_RESOURCE_REF_KEY] === 'string' ? String(c[MATERIAL_RESOURCE_REF_KEY]) : '';
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
      const resolved = await resolveMaterialResourceActive(key);
      resolvedByKey.set(key, resolved);
    })
  );

  for (const [key, comps] of compsByKey.entries()) {
    const resolved = resolvedByKey.get(key);
    if (!resolved) continue;

    for (const { comp, type } of comps) {
      // Safety: only hydrate when the resource kind matches the component type.
      if (resolved.kind !== type) continue;
      try {
        applyComponentDataWithInspector(comp, resolved.componentData);
      } catch {
        // ignore
      }
    }
  }
}
