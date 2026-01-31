/**
 * Texture loading service for material assets
 * Downloads and creates GPU textures from asset files
 */

import type { MaterialFile, MaterialTextures, MaterialMapType } from './types';

export interface TextureLoadResult {
  textures: MaterialTextures;
  loadedCount: number;
  errors: Array<{ mapType: string; error: string }>;
}

/**
 * Loads a single texture from URL
 */
async function loadSingleTexture(
  device: GPUDevice,
  url: string,
  mapType: string
): Promise<{ texture: GPUTexture; mapType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );

    return { texture, mapType };
  } catch (err) {
    console.warn(`Failed to load texture ${mapType} from ${url}:`, err);
    return null;
  }
}

/**
 * Loads all textures for a material asset
 * @param device WebGPU device
 * @param files Array of material files with mapType
 * @param baseUrl Base URL for fetching files (e.g., /api/assets/file/{key}/{version})
 * @returns Loaded textures organized by map type
 */
export async function loadMaterialTextures(
  device: GPUDevice,
  files: MaterialFile[],
  baseUrl: string
): Promise<TextureLoadResult> {
  const textures: MaterialTextures = {};
  const errors: Array<{ mapType: string; error: string }> = [];

  // Load all textures in parallel
  const loadPromises = files
    .filter(file => file.mapType) // Only files with a map type
    .map(file => {
      const url = `${baseUrl}/${file.fileName}`;
      return loadSingleTexture(device, url, file.mapType!);
    });

  const results = await Promise.all(loadPromises);

  // Organize results by map type
  let loadedCount = 0;
  for (const result of results) {
    if (result) {
      const mapType = result.mapType as MaterialMapType;
      textures[mapType] = result.texture;
      loadedCount++;
    }
  }

  return { textures, loadedCount, errors };
}

/**
 * Creates a default 1x1 white texture (fallback)
 */
export function createDefaultTexture(device: GPUDevice, type: 'white' | 'normal' | 'black' = 'white'): GPUTexture {
  const texture = device.createTexture({
    size: [1, 1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  let data: Uint8Array;
  switch (type) {
    case 'normal':
      // Normal map default: (0.5, 0.5, 1.0) in RGB = flat normal pointing up
      data = new Uint8Array([128, 128, 255, 255]);
      break;
    case 'black':
      // Black (for emission, height when not present)
      data = new Uint8Array([0, 0, 0, 255]);
      break;
    case 'white':
    default:
      // White (for albedo, roughness, metallic, ao)
      data = new Uint8Array([255, 255, 255, 255]);
      break;
  }

  // Ensure we provide a concrete ArrayBuffer-backed view (not SharedArrayBuffer)
  const ab = new ArrayBuffer(data.length);
  const view = new Uint8Array(ab);
  // copy contents into ArrayBuffer-backed view
  view.set(Array.from(data));

  device.queue.writeTexture(
    { texture },
    view,
    { bytesPerRow: 4 },
    { width: 1, height: 1 }
  );

  return texture;
}
