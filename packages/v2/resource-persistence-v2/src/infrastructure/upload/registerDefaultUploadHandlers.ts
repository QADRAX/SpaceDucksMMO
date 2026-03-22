import { CUSTOM_SHADER_RESOURCE_KINDS, MATERIAL_RESOURCE_KINDS } from '../../domain/kinds';
import { ResourceUploadRegistry } from './ResourceUploadRegistry';
import { AnimationClipUploadHandler } from './handlers/AnimationClipUploadHandler';
import { CustomShaderUploadHandler } from './handlers/CustomShaderUploadHandler';
import { MaterialUploadHandler } from './handlers/MaterialUploadHandler';
import { MeshResourceHandler } from './handlers/MeshResourceHandler';
import { ScriptUploadHandler } from './handlers/ScriptUploadHandler';
import { SkyboxUploadHandler } from './handlers/SkyboxUploadHandler';
import { TextureUploadHandler } from './handlers/TextureUploadHandler';

let registered = false;

export function registerDefaultUploadHandlers(): void {
  if (registered) return;
  registered = true;

  ResourceUploadRegistry.register(MATERIAL_RESOURCE_KINDS, new MaterialUploadHandler());
  ResourceUploadRegistry.register(CUSTOM_SHADER_RESOURCE_KINDS, new CustomShaderUploadHandler());
  ResourceUploadRegistry.register('mesh', new MeshResourceHandler());
  ResourceUploadRegistry.register('animationClip', new AnimationClipUploadHandler());
  ResourceUploadRegistry.register('script', new ScriptUploadHandler());
  ResourceUploadRegistry.register('texture', new TextureUploadHandler());
  ResourceUploadRegistry.register('skybox', new SkyboxUploadHandler());
}
