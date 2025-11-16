import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Componente que hace que una cámara "siga" y mire hacia otra entity.
 * Requiere CameraViewComponent en la misma entity.
 */
export class CameraTargetComponent extends Component {
  readonly type = 'cameraTarget';
  readonly metadata: ComponentMetadata = {
    type: 'cameraTarget',
    unique: true,
    requires: ['cameraView'], // Requiere cámara
    conflicts: []
  };

  private _targetEntityId: string;
  private _offset?: THREE.Vector3;
  private _followSpeed?: number;
  private _lookAtOffset?: THREE.Vector3;

  constructor(params: {
    targetEntityId: string;
    offset?: [number, number, number];
    followSpeed?: number;
    lookAtOffset?: [number, number, number];
  }) {
    super();
    this._targetEntityId = params.targetEntityId;
    this._offset = params.offset ? new THREE.Vector3(...params.offset) : undefined;
    this._followSpeed = params.followSpeed;
    this._lookAtOffset = params.lookAtOffset ? new THREE.Vector3(...params.lookAtOffset) : undefined;
  }

  // --- Propiedades reactivas ---

  get targetEntityId(): string {
    return this._targetEntityId;
  }

  set targetEntityId(value: string) {
    this._targetEntityId = value;
    this.notifyChanged();
  }

  get offset(): THREE.Vector3 | undefined {
    return this._offset;
  }

  set offset(value: THREE.Vector3 | [number, number, number] | undefined) {
    if (Array.isArray(value)) {
      this._offset = new THREE.Vector3(...value);
    } else {
      this._offset = value;
    }
    this.notifyChanged();
  }

  get followSpeed(): number | undefined {
    return this._followSpeed;
  }

  set followSpeed(value: number | undefined) {
    this._followSpeed = value;
    this.notifyChanged();
  }

  get lookAtOffset(): THREE.Vector3 | undefined {
    return this._lookAtOffset;
  }

  set lookAtOffset(value: THREE.Vector3 | [number, number, number] | undefined) {
    if (Array.isArray(value)) {
      this._lookAtOffset = new THREE.Vector3(...value);
    } else {
      this._lookAtOffset = value;
    }
    this.notifyChanged();
  }
}

export default CameraTargetComponent;
