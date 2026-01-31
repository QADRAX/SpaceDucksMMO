/**
 * WebGPU render pipeline creation for material preview
 */

import { createSphere } from './geometry';
import { createDefaultTexture } from './textures';
import { MATERIAL_SHADER_CODE } from './shaders';
import type { MaterialTextures } from './types';

export interface MaterialSettings {
  lightDirection: { x: number; y: number; z: number };
  lightIntensity: number;
  ambientIntensity: number;
  metallicMultiplier: number;
  roughnessMultiplier: number;
  aoStrength: number;
  normalStrength: number;
  heightScale: number;
  emissionStrength: number;
}

export interface RenderPipeline {
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  indexCount: number;
  settings: MaterialSettings;
  textureFlags: {
    hasNormal: boolean;
    hasRoughness: boolean;
    hasMetallic: boolean;
    hasAO: boolean;
  };
}

/**
 * Creates the complete render pipeline for material preview
 */
export function createMaterialRenderPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  textures: MaterialTextures,
  settings?: Partial<MaterialSettings>
): RenderPipeline {
  // Default settings with reduced lighting
  const materialSettings: MaterialSettings = {
    lightDirection: { x: 1.0, y: 1.0, z: 1.0 },
    lightIntensity: 0.5,
    ambientIntensity: 0.15,
    metallicMultiplier: 1.0,
    roughnessMultiplier: 1.0,
    aoStrength: 1.0,
    normalStrength: 0.3,
    heightScale: 0.05,
    emissionStrength: 1.0,
    ...settings,
  };
  
  // Create sphere geometry
  const sphereData = createSphere(1, 32, 32);

  // Create vertex buffer
  const vertexBuffer = device.createBuffer({
    size: sphereData.vertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(sphereData.vertices);
  vertexBuffer.unmap();

  // Create index buffer
  const indexBuffer = device.createBuffer({
    size: sphereData.indices.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(sphereData.indices);
  indexBuffer.unmap();

  // Create uniform buffer
  // Layout: mat4x4 (64) + hasFlags(16) + lightDir(12) + lightIntensity(4) + ambientIntensity(4) + 
  // metallicMult(4) + roughnessMult(4) + aoStrength(4) + normalStrength(4) + heightScale(4) + emissionStrength(4) + padding(4) = 128 bytes
  const uniformBuffer = device.createBuffer({
    size: 128,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Write texture availability flags and settings (offset 64)
  const uniformData = new Float32Array([
    textures.normal ? 1.0 : 0.0,        // hasNormal
    textures.roughness ? 1.0 : 0.0,     // hasRoughness
    textures.metallic ? 1.0 : 0.0,      // hasMetallic
    textures.ao ? 1.0 : 0.0,            // hasAO
    materialSettings.lightDirection.x,   // lightDir.x
    materialSettings.lightDirection.y,   // lightDir.y
    materialSettings.lightDirection.z,   // lightDir.z
    materialSettings.lightIntensity,     // lightIntensity
    materialSettings.ambientIntensity,   // ambientIntensity
    materialSettings.metallicMultiplier, // metallicMultiplier
    materialSettings.roughnessMultiplier,// roughnessMultiplier
    materialSettings.aoStrength,         // aoStrength
    materialSettings.normalStrength,     // normalStrength
    materialSettings.heightScale,        // heightScale
    materialSettings.emissionStrength,   // emissionStrength
    0.0,                                 // padding
  ]);
  device.queue.writeBuffer(uniformBuffer, 64, uniformData);

  // Create sampler
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  // Get or create default textures with appropriate defaults
  const defaultWhite = createDefaultTexture(device, 'white');
  const defaultNormal = createDefaultTexture(device, 'normal');
  const defaultBlack = createDefaultTexture(device, 'black');
  
  const albedoTex = textures.albedo || defaultWhite;
  const normalTex = textures.normal || defaultNormal;
  const roughnessTex = textures.roughness || defaultWhite;
  const metallicTex = textures.metallic || defaultBlack;  // Default to non-metallic
  const aoTex = textures.ao || defaultWhite;             // Default to no occlusion
  const heightTex = textures.height || defaultBlack;      // Default to no displacement
  const emissionTex = textures.emission || defaultBlack;  // Default to no emission

  // Create shader module
  const shaderModule = device.createShaderModule({
    code: MATERIAL_SHADER_CODE,
  });

  // Create pipeline
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: 32, // 3 floats (pos) + 3 floats (normal) + 2 floats (uv)
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
            { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
            { shaderLocation: 2, offset: 24, format: 'float32x2' }, // uv
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw',
    },
    depthStencil: undefined,
  });

  // Create bind group with all texture bindings
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: albedoTex.createView() },
      { binding: 3, resource: normalTex.createView() },
      { binding: 4, resource: roughnessTex.createView() },
      { binding: 5, resource: metallicTex.createView() },
      { binding: 6, resource: aoTex.createView() },
      { binding: 7, resource: heightTex.createView() },
      { binding: 8, resource: emissionTex.createView() },
    ],
  });

  return {
    pipeline,
    vertexBuffer,
    indexBuffer,
    uniformBuffer,
    bindGroup,
    indexCount: sphereData.indexCount,
    settings: materialSettings,
    textureFlags: {
      hasNormal: !!textures.normal,
      hasRoughness: !!textures.roughness,
      hasMetallic: !!textures.metallic,
      hasAO: !!textures.ao,
    },
  };
}
