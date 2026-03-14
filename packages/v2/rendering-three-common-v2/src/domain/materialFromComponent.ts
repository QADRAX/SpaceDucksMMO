import * as THREE from 'three';
import type { MaterialComponent } from '@duckengine/core-v2';
import { parseColor } from './parseColor';

/**
 * Builds a Three.js Material from a plain material component (standard/basic/phong/lambert).
 */
export function materialFromComponent(comp: MaterialComponent): THREE.Material {
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
