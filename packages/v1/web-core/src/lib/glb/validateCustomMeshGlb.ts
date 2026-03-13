/*
  Minimal GLB (glTF 2.0 binary) validator for the customMesh runtime profile.
  Profile enforced:
  - GLB container (not .gltf)
  - Exactly 1 glTF mesh (gltf.meshes.length === 1)
  - No animations (gltf.animations absent/empty)
  - No textures/images (gltf.textures + gltf.images absent/empty)
  - No skins (gltf.skins absent/empty)
*/

type GlbLike = ArrayBuffer | Uint8Array | Buffer;

function toUint8Array(input: GlbLike): Uint8Array {
  if (input instanceof Uint8Array) return input;
  // Buffer is a Uint8Array subtype, but keep this explicit for clarity.
  if (typeof Buffer !== 'undefined' && input instanceof Buffer) return input;
  return new Uint8Array(input);
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error('Invalid GLB: truncated');
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    // Node + modern runtimes.
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    // Fallback for environments without TextDecoder.
    return Buffer.from(bytes).toString('utf8');
  }
}

export type ParsedGltfJson = Record<string, unknown>;

export function parseGlbJson(glb: GlbLike): ParsedGltfJson {
  const bytes = toUint8Array(glb);
  if (bytes.length < 12) throw new Error('Invalid GLB: file too small');

  const magic = readU32LE(bytes, 0);
  // 'glTF' little endian
  if (magic !== 0x46546c67) throw new Error('Invalid GLB: bad magic');

  const version = readU32LE(bytes, 4);
  if (version !== 2) throw new Error(`Invalid GLB: unsupported version ${version}`);

  const declaredLength = readU32LE(bytes, 8);
  if (declaredLength !== bytes.length) {
    // Be strict; helps catch truncated uploads.
    throw new Error('Invalid GLB: length mismatch');
  }

  let offset = 12;
  if (offset + 8 > bytes.length) throw new Error('Invalid GLB: missing chunks');

  const jsonChunkLength = readU32LE(bytes, offset);
  const jsonChunkType = readU32LE(bytes, offset + 4);
  offset += 8;

  // 'JSON'
  if (jsonChunkType !== 0x4e4f534a) throw new Error('Invalid GLB: first chunk is not JSON');
  if (offset + jsonChunkLength > bytes.length) throw new Error('Invalid GLB: JSON chunk out of range');

  const jsonBytes = bytes.slice(offset, offset + jsonChunkLength);
  offset += jsonChunkLength;

  const jsonText = decodeUtf8(jsonBytes).trim();
  let gltf: unknown;
  try {
    gltf = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid GLB: JSON chunk is not valid JSON');
  }

  if (!gltf || typeof gltf !== 'object' || Array.isArray(gltf)) {
    throw new Error('Invalid GLB: JSON root must be an object');
  }

  return gltf as ParsedGltfJson;
}

function arrayLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/**
 * Throws an Error if the GLB does not satisfy the strict customMesh profile.
 */
export function assertCustomMeshGlbProfile(glb: GlbLike): void {
  const gltf = parseGlbJson(glb);

  const meshes = (gltf as any).meshes;
  const animations = (gltf as any).animations;
  const textures = (gltf as any).textures;
  const images = (gltf as any).images;
  const skins = (gltf as any).skins;

  const meshCount = arrayLen(meshes);
  if (meshCount !== 1) {
    throw new Error(`customMesh GLB must contain exactly 1 mesh (found ${meshCount})`);
  }

  // Require actual geometry + UVs so PBR textures can render.
  const mesh0 = Array.isArray(meshes) ? meshes[0] : undefined;
  const primitives = mesh0 && typeof mesh0 === 'object' ? (mesh0 as any).primitives : undefined;
  if (!Array.isArray(primitives) || primitives.length === 0) {
    throw new Error('customMesh GLB mesh must contain at least 1 primitive');
  }

  const accessors = (gltf as any).accessors;
  const checkAccessorType = (accessorIndex: unknown, expectedType: string, label: string) => {
    if (!Array.isArray(accessors)) return;
    if (typeof accessorIndex !== 'number') return;
    const acc = accessors[accessorIndex];
    if (!acc || typeof acc !== 'object') return;
    const t = (acc as any).type;
    if (typeof t === 'string' && t !== expectedType) {
      throw new Error(`customMesh GLB ${label} accessor must be ${expectedType} (found ${t})`);
    }
  };

  for (let i = 0; i < primitives.length; i++) {
    const prim = primitives[i];
    const attrs = prim && typeof prim === 'object' ? (prim as any).attributes : undefined;
    if (!attrs || typeof attrs !== 'object') {
      throw new Error(`customMesh GLB primitive[${i}] must have attributes`);
    }
    if ((attrs as any).POSITION === undefined) {
      throw new Error(`customMesh GLB primitive[${i}] must include POSITION attribute`);
    }
    if ((attrs as any).TEXCOORD_0 === undefined) {
      throw new Error(
        `customMesh GLB primitive[${i}] must include TEXCOORD_0 UVs (required for PBR textures)`
      );
    }
    checkAccessorType((attrs as any).POSITION, 'VEC3', `primitive[${i}] POSITION`);
    checkAccessorType((attrs as any).TEXCOORD_0, 'VEC2', `primitive[${i}] TEXCOORD_0`);
  }

  const animCount = arrayLen(animations);
  if (animCount > 0) {
    throw new Error('customMesh GLB must not contain animations');
  }

  const skinCount = arrayLen(skins);
  if (skinCount > 0) {
    throw new Error('customMesh GLB must not contain skins');
  }

  const textureCount = arrayLen(textures);
  const imageCount = arrayLen(images);
  if (textureCount > 0 || imageCount > 0) {
    throw new Error('customMesh GLB must not contain textures/images');
  }
}
