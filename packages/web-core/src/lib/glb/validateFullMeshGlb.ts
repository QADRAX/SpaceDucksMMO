/*
  Validator / metadata extractor for "fullMesh" GLB profile.

  Profile expectations (looser than customMesh):
  - GLB container (binary .glb)
  - At least 1 mesh present
  - Primitives must include POSITION attribute
  - Animations allowed (we extract names if present)

  This module reuses parseGlbJson exported by validateCustomMeshGlb.ts
  to avoid full glb binary parsing; it reads the JSON chunk to inspect
  meshes/animations.
*/
import type { ParsedGltfJson } from './validateCustomMeshGlb';
import { parseGlbJson } from './validateCustomMeshGlb';

type GlbLike = ArrayBuffer | Uint8Array | Buffer;

export function assertFullMeshGlbProfile(glb: GlbLike): { animations: string[] } {
  const gltf = parseGlbJson(glb) as ParsedGltfJson;

  const meshes = (gltf as any).meshes;
  const meshCount = Array.isArray(meshes) ? meshes.length : 0;
  if (meshCount < 1) {
    throw new Error(`fullMesh GLB must contain at least 1 mesh (found ${meshCount})`);
  }

  const accessors = (gltf as any).accessors;

  const checkAccessorType = (accessorIndex: unknown, expectedType: string, label: string) => {
    if (!Array.isArray(accessors)) return;
    if (typeof accessorIndex !== 'number') return;
    const acc = accessors[accessorIndex];
    if (!acc || typeof acc !== 'object') return;
    const t = (acc as any).type;
    if (typeof t === 'string' && t !== expectedType) {
      throw new Error(`fullMesh GLB ${label} accessor must be ${expectedType} (found ${t})`);
    }
  };

  // Ensure primitives have POSITION attribute (UVs optional but recommended)
  for (let mi = 0; mi < meshCount; mi++) {
    const mesh0 = (meshes as any)[mi];
    const primitives = mesh0 && typeof mesh0 === 'object' ? (mesh0 as any).primitives : undefined;
    if (!Array.isArray(primitives) || primitives.length === 0) {
      throw new Error(`fullMesh GLB mesh[${mi}] must contain at least 1 primitive`);
    }
    for (let i = 0; i < primitives.length; i++) {
      const prim = primitives[i];
      const attrs = prim && typeof prim === 'object' ? (prim as any).attributes : undefined;
      if (!attrs || typeof attrs !== 'object') {
        throw new Error(`fullMesh GLB primitive[${i}] must have attributes`);
      }
      if ((attrs as any).POSITION === undefined) {
        throw new Error(`fullMesh GLB primitive[${i}] must include POSITION attribute`);
      }
      checkAccessorType((attrs as any).POSITION, 'VEC3', `primitive[${i}] POSITION`);
    }
  }

  // Extract animation names (if any)
  const animations = Array.isArray((gltf as any).animations) ? (gltf as any).animations : [];
  const names: string[] = [];
  for (const a of animations) {
    const n = a && typeof a === 'object' ? String((a as any).name || '') : '';
    if (n) names.push(n);
  }

  return { animations: names };
}

export default assertFullMeshGlbProfile;
