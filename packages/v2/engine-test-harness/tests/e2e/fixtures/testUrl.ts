export type RenderingBackend = 'webgl' | 'webgpu';

/**
 * Builds the test page URL with backend and optional query params.
 * Used to run the same test with WebGL and WebGPU renderers.
 */
export function buildTestUrl(
  path: string,
  backend: RenderingBackend,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  params.set('backend', backend);
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
