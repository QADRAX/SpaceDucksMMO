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
  renderFrame(): void;
}

export default IRenderingEngine;
