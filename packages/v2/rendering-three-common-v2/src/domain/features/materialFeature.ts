import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';
import { parseColor } from '../parseColor';

const MATERIAL_TYPES = [
  'standardMaterial',
  'basicMaterial',
  'phongMaterial',
  'lambertMaterial',
] as const;

type MaterialComponentLike = { type: string; color?: string; transparent?: boolean; opacity?: number };

function getMaterialComponent(entity: EntityState): MaterialComponentLike | undefined {
  for (const t of MATERIAL_TYPES) {
    const c = getComponent(entity, t);
    if (c) return c as unknown as MaterialComponentLike;
  }
  return undefined;
}

function buildMaterial(comp: MaterialComponentLike): THREE.Material {
  const color = comp.color ? parseColor(comp.color, 0xcccccc) : 0xcccccc;
  const transparent = comp.transparent ?? false;
  const opacity = comp.opacity ?? 1;

  switch (comp.type) {
    case 'basicMaterial':
      return new THREE.MeshBasicMaterial({ color, transparent, opacity });
    case 'lambertMaterial':
      return new THREE.MeshLambertMaterial({ color, transparent, opacity });
    case 'phongMaterial':
      return new THREE.MeshPhongMaterial({ color, transparent, opacity });
    case 'standardMaterial':
    default:
      return new THREE.MeshStandardMaterial({ color, transparent, opacity });
  }
}

function findMesh(root: THREE.Object3D | undefined): THREE.Mesh | undefined {
  if (!root) return undefined;
  if (root instanceof THREE.Mesh) return root;
  for (const child of root.children) {
    const m = findMesh(child);
    if (m) return m;
  }
  return undefined;
}

/**
 * Feature: sync material component to mesh material. Requires entity to already have a mesh (GeometryFeature).
 * Material feature does not register an object; it updates the mesh created by GeometryFeature.
 */
export function createMaterialFeature(): RenderFeature {
  return {
    name: 'MaterialFeature',

    isEligible(entity, _scene) {
      return getMaterialComponent(entity) !== undefined;
    },

    onAttach(entity, context) {
      const ctx = context as RenderContextThree;
      const comp = getMaterialComponent(entity);
      if (!comp) return;
      const root = ctx.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh) {
        const prev = mesh.material as THREE.Material;
        if (prev) prev.dispose();
        mesh.material = buildMaterial(comp);
      }
    },

    onUpdate(entity, componentType, context) {
      if (!MATERIAL_TYPES.includes(componentType as (typeof MATERIAL_TYPES)[number])) return;
      const ctx = context as RenderContextThree;
      const comp = getMaterialComponent(entity);
      if (!comp) return;
      const root = ctx.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh) {
        const prev = mesh.material as THREE.Material;
        if (prev) prev.dispose();
        mesh.material = buildMaterial(comp);
      }
    },

    onDetach(_entity, _context) {
      // Mesh and material are owned by GeometryFeature; no-op here.
    },
  };
}
