import { CUSTOM_SHADER_RESOURCE_KIND_SET } from './componentPayload';

/**
 * Ensures multipart form contains required file fields for the given resource kind.
 */
export function assertMultipartFormHasRequiredFiles(kind: string, formData: FormData): void {
  const fileSlots = new Set(
    Array.from(formData.entries())
      .filter(([, v]) => v instanceof File && (v as File).size > 0)
      .map(([k]) => k.toLowerCase())
  );

  if (kind === 'mesh') {
    if (!fileSlots.has('geometry')) throw new Error("mesh requires a 'geometry' file field");
    return;
  }
  if (kind === 'texture') {
    if (!fileSlots.has('image')) throw new Error("texture requires an 'image' file field");
    return;
  }
  if (kind === 'script') {
    if (!fileSlots.has('source')) throw new Error("script requires a 'source' file field");
    return;
  }
  if (kind === 'animationClip') {
    if (!fileSlots.has('clip')) throw new Error("animationClip requires a 'clip' file field");
    return;
  }
  if (kind === 'skybox') {
    const req = ['px', 'nx', 'py', 'ny', 'pz'];
    for (const r of req) {
      if (!fileSlots.has(r)) {
        throw new Error(`skybox requires all cube face file fields: ${req.join(', ')}`);
      }
    }
    return;
  }
  if (CUSTOM_SHADER_RESOURCE_KIND_SET.has(kind)) {
    if (!fileSlots.has('vertexsource') || !fileSlots.has('fragmentsource')) {
      throw new Error(`${kind} requires vertexSource and fragmentSource file fields`);
    }
  }
}
