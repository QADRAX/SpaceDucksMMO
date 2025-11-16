import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';
import type { Entity } from './Entity';
import { GeometryComponent } from './GeometryComponent';

/**
 * Componente que hace orbitar una entity alrededor de otra.
 */
export class OrbitComponent extends Component {
  readonly type = 'orbit';
  readonly metadata: ComponentMetadata = {
    type: 'orbit',
    unique: true,
    requires: [], // No requiere nada (Transform siempre existe)
    conflicts: []
  };

  private _targetEntityId: string;
  private _altitudeFromSurface: number;
  private _speed: number; // radianes por segundo
  private _angle: number = 0;
  private _orbitPlane: 'xy' | 'xz' | 'yz' = 'xz'; // plano de órbita

  constructor(params: {
    targetEntityId: string;
    altitudeFromSurface: number;
    speed: number;
    initialAngle?: number;
    orbitPlane?: 'xy' | 'xz' | 'yz';
  }) {
    super();
    this._targetEntityId = params.targetEntityId;
    this._altitudeFromSurface = params.altitudeFromSurface;
    this._speed = params.speed;
    this._angle = params.initialAngle ?? 0;
    this._orbitPlane = params.orbitPlane ?? 'xz';
  }

  // --- Propiedades reactivas ---

  get targetEntityId(): string {
    return this._targetEntityId;
  }

  set targetEntityId(value: string) {
    this._targetEntityId = value;
    this.notifyChanged();
  }

  get altitudeFromSurface(): number {
    return this._altitudeFromSurface;
  }

  set altitudeFromSurface(value: number) {
    this._altitudeFromSurface = value;
    this.notifyChanged();
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this._speed = value;
    this.notifyChanged();
  }

  get angle(): number {
    return this._angle;
  }

  get orbitPlane(): 'xy' | 'xz' | 'yz' {
    return this._orbitPlane;
  }

  set orbitPlane(value: 'xy' | 'xz' | 'yz') {
    this._orbitPlane = value;
    this.notifyChanged();
  }

  /**
   * Actualiza el ángulo orbital.
   * @internal Llamado por OrbitSystem
   */
  updateAngle(dt: number): void {
    this._angle += this._speed * dt;
    if (this._angle > Math.PI * 2) {
      this._angle -= Math.PI * 2;
    }
  }

  /**
   * Calcula el radio efectivo del objeto target considerando geometría y escala.
   */
  calculateTargetRadius(target: Entity): number {
    const geometry = target.getComponent<GeometryComponent>('geometry');
    if (geometry) {
      return geometry.getEffectiveRadius(target.transform.worldScale);
    }
    return 0;
  }
}

export default OrbitComponent;
