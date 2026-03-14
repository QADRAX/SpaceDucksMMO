import { createSceneSubsystem } from '../../domain/subsystems';
import { ResourceCachePortDef } from '../../domain/ports';
import type { ResourceCachePort } from '../../domain/ports';
import {
  collectRefsFromSubtree,
  collectRefsFromScene,
} from './collectResourceRefs';
import type { SubsystemEventParams } from '../../domain/subsystems';

/**
 * Creates the ResourceCoordinator scene subsystem.
 * Listens to entity-added, component-changed, scene-setup and preloads
 * resource refs (mesh, texture, skybox, script) into the ResourceCachePort.
 *
 * Register via api.setup({ sceneSubsystems: [createResourceCoordinatorSubsystem()] }).
 * Requires ResourceCachePort (from deriveResourceCache) and ResourceLoaderPort to be registered.
 */
export function createResourceCoordinatorSubsystem() {
  return createSceneSubsystem<ResourceCachePort | null>({
    id: 'resource-coordinator',
    createState(ctx) {
      return ctx.ports.get(ResourceCachePortDef) ?? null;
    },
    events: {
      'entity-added': preloadEntityRefs,
      'component-changed': preloadEntityRefsOnChange,
      'scene-setup': preloadAllSceneRefs,
    },
  });
}

const preloadEntityRefs = {
  name: 'resource-coordinator/entity-added',
  event: 'entity-added' as const,
  execute(state: ResourceCachePort | null, params: SubsystemEventParams) {
    if (params.event.kind !== 'entity-added' || !state) return;
    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;

    const refs = collectRefsFromSubtree(entity);
    for (const ref of refs.meshes) void state.preloadMesh(ref);
    for (const ref of refs.textures) void state.preloadTexture(ref);
    for (const ref of refs.skyboxes) void state.preloadSkybox(ref);
    for (const ref of refs.scripts) void state.preloadScript(ref);
  },
};

const preloadEntityRefsOnChange = {
  name: 'resource-coordinator/component-changed',
  event: 'component-changed' as const,
  execute(state: ResourceCachePort | null, params: SubsystemEventParams) {
    if (params.event.kind !== 'component-changed' || !state) return;
    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;

    const refs = collectRefsFromSubtree(entity);
    for (const ref of refs.meshes) void state.preloadMesh(ref);
    for (const ref of refs.textures) void state.preloadTexture(ref);
    for (const ref of refs.skyboxes) void state.preloadSkybox(ref);
    for (const ref of refs.scripts) void state.preloadScript(ref);
  },
};

const preloadAllSceneRefs = {
  name: 'resource-coordinator/scene-setup',
  event: 'scene-setup' as const,
  execute(state: ResourceCachePort | null, params: SubsystemEventParams) {
    if (params.event.kind !== 'scene-setup' || !state) return;

    const refs = collectRefsFromScene(params.scene);
    for (const ref of refs.meshes) void state.preloadMesh(ref);
    for (const ref of refs.textures) void state.preloadTexture(ref);
    for (const ref of refs.skyboxes) void state.preloadSkybox(ref);
    for (const ref of refs.scripts) void state.preloadScript(ref);
  },
};
