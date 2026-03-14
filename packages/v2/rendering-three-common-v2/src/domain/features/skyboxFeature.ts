import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { SkyboxComponent } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';

/**
 * Feature: sync skybox component to scene background (CubeTexture).
 * Scene-level: at most one entity has skybox. Does not register an object; sets context.threeScene.background.
 */
export function createSkyboxFeature(): RenderFeature<RenderContextThree> {
  let skyboxEntityId: string | null = null;

  return {
    name: 'SkyboxFeature',

    syncEntity(entity, context) {
      const comp = getComponent<SkyboxComponent>(entity, 'skybox');

      if (comp?.skybox && context.getSkyboxTexture) {
        const cubeTexture = context.getSkyboxTexture(comp.skybox);
        if (cubeTexture) context.threeScene.background = cubeTexture;
        skyboxEntityId = entity.id;
      } else if (entity.id === skyboxEntityId) {
        context.threeScene.background = null;
        skyboxEntityId = null;
      }
    },

    onUpdate(entity, componentType, context) {
      if (componentType !== 'skybox') return;
      const comp = getComponent<SkyboxComponent>(entity, 'skybox');
      if (!comp?.skybox || !context.getSkyboxTexture) {
        context.threeScene.background = null;
        return;
      }
      const cubeTexture = context.getSkyboxTexture(comp.skybox);
      context.threeScene.background = cubeTexture ?? null;
    },

    onDetachById(entityId, context) {
      if (entityId === skyboxEntityId) {
        context.threeScene.background = null;
        skyboxEntityId = null;
      }
    },
  };
}
