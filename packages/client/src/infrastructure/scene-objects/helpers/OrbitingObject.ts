import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import * as THREE from 'three';

/**
 * Helper class to make any scene object orbit around a center point.
 * Useful for creating planetary systems, satellites, or any rotating decoration.
 */
export class OrbitingObject implements ISceneObject {
  readonly id: string;
  private sceneObject: ISceneObject & { getObject3D(): THREE.Object3D };
  private orbitRadius: number;
  private orbitSpeed: number;
  private orbitAngle: number;
  private orbitTilt: number;
  private centerOffset: THREE.Vector3;
  
  constructor(
    id: string,
    sceneObject: ISceneObject & { getObject3D(): THREE.Object3D },
    orbitRadius: number,
    orbitSpeed: number,
    startAngle: number = 0,
    orbitTilt: number = 0,
    centerOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  ) {
    this.id = id;
    this.sceneObject = sceneObject;
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed;
    this.orbitAngle = startAngle;
    this.orbitTilt = orbitTilt;
    this.centerOffset = centerOffset;
  }
  
  addTo(scene: THREE.Scene): void {
    this.sceneObject.addTo(scene);
    this.updatePosition();
  }
  
  update(dt: number): void {
    // Update orbit angle
    this.orbitAngle += this.orbitSpeed * dt;
    this.updatePosition();
    
    // Update the wrapped object
    this.sceneObject.update(dt);
  }
  
  private updatePosition(): void {
    const obj = this.sceneObject.getObject3D();
    if (obj) {
      // Calculate position on orbital path
      const x = Math.cos(this.orbitAngle) * this.orbitRadius + this.centerOffset.x;
      const z = Math.sin(this.orbitAngle) * this.orbitRadius + this.centerOffset.z;
      const y = Math.sin(this.orbitAngle) * this.orbitTilt + this.centerOffset.y;
      
      obj.position.set(x, y, z);
    }
  }
  
  removeFrom(scene: THREE.Scene): void {
    const obj = this.sceneObject.getObject3D();
    if (obj) {
      scene.remove(obj);
    }
    this.sceneObject.dispose?.();
  }
}
