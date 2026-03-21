import { definePort } from '../../subsystems/definePort';
import type { ResourceCachePort } from './resourceCachePort';

/**
 * Definition for the ResourceCachePort.
 * Implemented by rendering-three-common-v2; registered by resource-coordinator-v2.
 */
export const ResourceCachePortDef = definePort<ResourceCachePort>('resourceCache')
  .addMethod('getMeshData')
  .addMethod('getSkeletonData')
  .addMethod('getAnimationClipData')
  .addMethod('getTexture')
  .addMethod('getSkyboxTexture')
  .addMethod('getScriptSource')
  .addMethod('storeMeshData')
  .addMethod('storeSkeletonData')
  .addMethod('storeAnimationClipData')
  .addMethod('storeTextureFromBlob', { async: true })
  .addMethod('storeSkyboxFromUrls', { async: true })
  .addMethod('storeScriptSource')
  .build();
