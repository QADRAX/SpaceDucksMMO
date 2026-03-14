import { definePort } from '../../subsystems/definePort';
import type { ResourceCachePort } from './resourceCachePort';

/**
 * Definition for the ResourceCachePort.
 * Implemented by rendering-three-common-v2; registered by port deriver when ResourceLoaderPort exists.
 */
export const ResourceCachePortDef = definePort<ResourceCachePort>('resourceCache')
  .addMethod('getMeshData')
  .addMethod('getTexture')
  .addMethod('getSkyboxTexture')
  .addMethod('preloadMesh', { async: true })
  .addMethod('preloadTexture', { async: true })
  .addMethod('preloadSkybox', { async: true })
  .addMethod('preloadScript', { async: true })
  .addMethod('getScriptSource')
  .build();
