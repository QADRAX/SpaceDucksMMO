import * as THREE from 'three';
import type IComponent from './IComponent';

export class TransformComponent implements IComponent {
  readonly type = 'transform';
  position = new THREE.Vector3();
  rotation = new THREE.Euler();
  scale = new THREE.Vector3(1, 1, 1);

  constructor(init?: { position?: [number, number, number]; rotationY?: number; scale?: [number, number, number] }) {
    if (init?.position) this.position.set(init.position[0], init.position[1], init.position[2]);
    if (init?.rotationY) this.rotation.y = init.rotationY;
    if (init?.scale) this.scale.set(init.scale[0], init.scale[1], init.scale[2]);
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  setRotationY(y: number): void {
    this.rotation.y = y;
  }

  setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
  }
}

export default TransformComponent;
