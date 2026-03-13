import type { MaterialResourceKind } from '@/lib/types';

export type ResolvedMaterialComponent = {
  kind: MaterialResourceKind;
  componentData: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function resolveMaterialResourceActive(key: string): Promise<ResolvedMaterialComponent> {
  const url = `/api/engine/resources/resolve?key=${encodeURIComponent(key)}&version=active`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body as any)?.error === 'string' ? (body as any).error : `Failed to resolve material (${res.status})`;
    throw new Error(msg);
  }

  const json = (await res.json()) as any;
  const componentType = String(json?.componentType ?? '');

  const allowed: MaterialResourceKind[] = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
  if (!allowed.includes(componentType as any)) {
    throw new Error(`Resolved resource is not a material: ${componentType || 'unknown'}`);
  }

  const data: Record<string, unknown> = isPlainObject(json?.componentData) ? (json.componentData as Record<string, unknown>) : {};
  const files = isPlainObject(json?.files) ? (json.files as Record<string, any>) : {};

  const dataWithResolvedFiles: Record<string, unknown> = { ...data };
  for (const [slot, file] of Object.entries(files)) {
    const fileUrl = (file as any)?.url;
    if (typeof fileUrl === 'string' && fileUrl) {
      dataWithResolvedFiles[slot] = fileUrl;

      // Alias common base-color slots to the engine's material field name.
      // In ECS material components, the albedo map is typically `texture`.
      if (slot === 'baseColor' || slot === 'albedo') {
        const current = dataWithResolvedFiles.texture;
        if (typeof current !== 'string' || current.trim().length === 0) {
          dataWithResolvedFiles.texture = fileUrl;
        }
      }
    }
  }

  return { kind: componentType as MaterialResourceKind, componentData: dataWithResolvedFiles };
}
