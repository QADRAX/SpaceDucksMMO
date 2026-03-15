import type {
  EngineState,
  ResourceCachePort,
  ResourceRef,
  MeshGeometryFileData,
  ResolvedResource,
} from '@duckengine/core-v2';
import { emitEngineChange } from '@duckengine/core-v2';
import { DiagnosticPortDef } from '@duckengine/core-v2';
import type { ResourceLoader } from './resourceLoader';
import type { CollectedRefs } from './collectResourceRefs';

function getDiagnostic(engine: EngineState) {
  return engine.subsystemRuntime.ports.get(DiagnosticPortDef.id) as
    | { log(level: string, msg: string, ctx?: object): void }
    | undefined;
}

async function loadMesh(
  engine: EngineState,
  loader: ResourceLoader,
  cache: ResourceCachePort,
  ref: ResourceRef<'mesh'>,
): Promise<void> {
  if (cache.getMeshData?.(ref)) return;

  const result = await loader.resolve(ref);
  if (result.ok === false) return;

  const resolved = result.value as ResolvedResource<'mesh'>;
  const geometryFile = resolved.files.geometry;
  if (!geometryFile?.url) return;

  const fetchResult = await loader.fetchFile(geometryFile.url, 'text');
  if (fetchResult.ok === false) return;

  const data = JSON.parse(fetchResult.value as string) as MeshGeometryFileData;
  cache.storeMeshData?.(ref, data);
  emitEngineChange(engine, { kind: 'resource-loaded', ref });
}

async function loadTexture(
  engine: EngineState,
  loader: ResourceLoader,
  cache: ResourceCachePort,
  ref: ResourceRef<'texture'>,
): Promise<void> {
  const diag = getDiagnostic(engine);
  if (cache.getTexture?.(ref)) return;

  const result = await loader.resolve(ref);
  if (result.ok === false) {
    diag?.log('warn', 'Texture resolve failed', { ref: ref.key, error: (result as { error?: unknown }).error });
    return;
  }

  const resolved = result.value as ResolvedResource<'texture'>;
  const imageFile = resolved.files.image;
  if (!imageFile?.url) {
    diag?.log('warn', 'Texture has no image URL', { ref: ref.key });
    return;
  }

  diag?.log('debug', 'Fetching texture', { ref: ref.key, url: imageFile.url });
  const fetchResult = await loader.fetchFile(imageFile.url, 'blob');
  if (fetchResult.ok === false) {
    diag?.log('warn', 'Texture fetch failed', { ref: ref.key, url: imageFile.url, error: (fetchResult as { error?: unknown }).error });
    return;
  }

  await cache.storeTextureFromBlob?.(ref, fetchResult.value as Blob);
  diag?.log('debug', 'Texture loaded', { ref: ref.key, url: imageFile.url });
  emitEngineChange(engine, { kind: 'resource-loaded', ref });
}

async function loadSkybox(
  engine: EngineState,
  loader: ResourceLoader,
  cache: ResourceCachePort,
  ref: ResourceRef<'skybox'>,
): Promise<void> {
  if (cache.getSkyboxTexture?.(ref)) return;

  const result = await loader.resolve(ref);
  if (result.ok === false) return;

  const resolved = result.value as ResolvedResource<'skybox'>;
  const { px, nx, py, ny, pz } = resolved.files;
  if (!px?.url || !nx?.url || !py?.url || !ny?.url || !pz?.url) return;

  const urls = [px.url, nx.url, py.url, ny.url, pz.url, py.url];
  await cache.storeSkyboxFromUrls?.(ref, urls);
  emitEngineChange(engine, { kind: 'resource-loaded', ref });
}

function scriptCacheKey(ref: ResourceRef<'script'>): string {
  return `${ref.key}@${ref.version ?? 'active'}`;
}

const scriptLoadInFlight = new Map<string, Promise<void>>();

async function loadScript(
  engine: EngineState,
  loader: ResourceLoader,
  cache: ResourceCachePort,
  ref: ResourceRef<'script'>,
): Promise<void> {
  if (cache.getScriptSource(ref)) return;

  const key = scriptCacheKey(ref);
  const existing = scriptLoadInFlight.get(key);
  if (existing) {
    await existing;
    return;
  }

  const load = (async () => {
    const result = await loader.resolve(ref);
    if (result.ok === false) return;

    const resolved = result.value as ResolvedResource<'script'>;
    const sourceFile = resolved.files.source;
    if (!sourceFile?.url) return;

    const fetchResult = await loader.fetchFile(sourceFile.url, 'text');
    if (fetchResult.ok === false) return;

    cache.storeScriptSource?.(ref, fetchResult.value as string);
    emitEngineChange(engine, { kind: 'resource-loaded', ref });
  })();

  scriptLoadInFlight.set(key, load);
  await load;
  scriptLoadInFlight.delete(key);
}

/**
 * Loads collected refs via ResourceLoader and stores in cache.
 * Only ResourceCoordinator calls the loader; other subsystems read sync from cache.
 * Emits resource-loaded after each store so subsystems can reconcile pending refs.
 */
export async function loadRefsIntoCache(
  engine: EngineState,
  loader: ResourceLoader,
  cache: ResourceCachePort,
  refs: CollectedRefs,
): Promise<void> {
  const diag = getDiagnostic(engine);
  const total = refs.meshes.length + refs.textures.length + refs.skyboxes.length + refs.scripts.length;
  if (total > 0) {
    diag?.log('debug', 'Loading refs into cache', {
      meshes: refs.meshes.length,
      textures: refs.textures.length,
      skyboxes: refs.skyboxes.length,
      scripts: refs.scripts.length,
    });
  }
  for (const ref of refs.meshes) void loadMesh(engine, loader, cache, ref);
  for (const ref of refs.textures) void loadTexture(engine, loader, cache, ref);
  for (const ref of refs.skyboxes) void loadSkybox(engine, loader, cache, ref);
  for (const ref of refs.scripts) void loadScript(engine, loader, cache, ref);
}
