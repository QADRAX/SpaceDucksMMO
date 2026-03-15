import * as THREE from 'three';
import type { GizmoPort } from '@duckengine/core-v2';
import type { Vec3Like } from '@duckengine/core-v2';
import { colorToHex } from './colorToHex';

const DEFAULT_COLOR = 0xffff00;

/**
 * Creates a GizmoPort that draws into a Three.js scene.
 * Objects are collected and cleared each frame.
 */
export function createGizmoDrawer(threeScene: THREE.Scene): GizmoPort {
  const objects: THREE.Object3D[] = [];

  function add(obj: THREE.Object3D): void {
    objects.push(obj);
    threeScene.add(obj);
  }

  return {
    drawLine(from: Vec3Like, to: Vec3Like, color?: import('@duckengine/core-v2').Color) {
      const hex = colorToHex(color, DEFAULT_COLOR);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(to.x, to.y, to.z),
      ]);
      const material = new THREE.LineBasicMaterial({ color: hex });
      const line = new THREE.Line(geometry, material);
      add(line);
    },

    drawSphere(center: Vec3Like, radius: number, color?: import('@duckengine/core-v2').Color) {
      const hex = colorToHex(color, DEFAULT_COLOR);
      const geometry = new THREE.SphereGeometry(radius, 12, 8);
      const material = new THREE.MeshBasicMaterial({
        color: hex,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(center.x, center.y, center.z);
      add(mesh);
    },

    drawBox(center: Vec3Like, size: Vec3Like, color?: import('@duckengine/core-v2').Color) {
      const hex = colorToHex(color, DEFAULT_COLOR);
      const geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
      const material = new THREE.MeshBasicMaterial({
        color: hex,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(center.x, center.y, center.z);
      add(mesh);
    },

    drawLabel(_text: string, position: Vec3Like, color?: import('@duckengine/core-v2').Color) {
      // Text labels require a text renderer (e.g. CSS2DRenderer or sprite).
      // For now, draw a small sphere as a placeholder.
      const hex = colorToHex(color, DEFAULT_COLOR);
      const geometry = new THREE.SphereGeometry(0.05, 6, 4);
      const material = new THREE.MeshBasicMaterial({ color: hex });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, position.z);
      add(mesh);
    },

    drawGrid(size: number, divisions: number, color?: import('@duckengine/core-v2').Color) {
      const hex = colorToHex(color, 0x444444);
      const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
      const material = new THREE.MeshBasicMaterial({
        color: hex,
        wireframe: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      add(mesh);
    },

    clear() {
      for (const obj of objects) {
        threeScene.remove(obj);
        const o = obj as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mat = o.material;
          if (Array.isArray(mat)) for (const m of mat) m.dispose();
          else mat.dispose();
        }
      }
      objects.length = 0;
    },
  };
}
