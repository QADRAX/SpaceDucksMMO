/**
 * WebGPU type definitions for TypeScript
 * This file provides type definitions for WebGPU APIs
 */

export interface WebGPUSupport {
  supported: boolean;
  error?: string;
}

export function checkWebGPUSupport(): WebGPUSupport {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Not in browser environment' };
  }

  if (!('gpu' in navigator)) {
    return { 
      supported: false, 
      error: 'WebGPU not supported in this browser. Try Chrome/Edge 113+ or Safari 18+' 
    };
  }

  return { supported: true };
}

/**
 * Material map types based on Prisma schema
 * mapType: "albedo" | "normal" | "roughness" | "metallic" | "ao" | "height" | "emission"
 */
export type MaterialMapType = 
  | 'albedo' 
  | 'normal' 
  | 'roughness' 
  | 'metallic' 
  | 'ao' 
  | 'height' 
  | 'emission';

export const MATERIAL_MAP_TYPES: readonly MaterialMapType[] = [
  'albedo',
  'normal',
  'roughness',
  'metallic',
  'ao',
  'height',
  'emission',
] as const;

export interface MaterialFile {
  fileName: string;
  mapType: string | null;
}

export interface MaterialTextures {
  albedo?: GPUTexture;
  normal?: GPUTexture;
  roughness?: GPUTexture;
  metallic?: GPUTexture;
  ao?: GPUTexture;
  height?: GPUTexture;
  emission?: GPUTexture;
}
