import * as THREE from 'three';
import type { ISceneObject } from '../scene/ISceneObject';

/**
 * Port abstraction for a rendering engine.
 * Allows application layer to remain decoupled from Three.js specifics.
 */
export interface IRenderingEngine {
  init(container: HTMLElement): void;
  add(object: ISceneObject): void;
  remove(id: string): void;
  getScene(): THREE.Scene;
  getCamera(): THREE.Camera;
  /** Replace the active camera used for rendering. When set, renderer will use this camera. */
  setCamera(camera: THREE.Camera): void;
  renderFrame(): void;
}

export default IRenderingEngine;
