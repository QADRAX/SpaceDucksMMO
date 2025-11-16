import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

export type LightType = 'ambient' | 'directional' | 'point' | 'spot';

export interface LightParamsBase {
  color?: string | number;
  intensity?: number;
}

export type LightParams =
  | (LightParamsBase & { type: 'ambient' })
  | (LightParamsBase & { type: 'directional' })
  | (LightParamsBase & { type: 'point'; distance?: number; decay?: number })
  | (LightParamsBase & { type: 'spot'; distance?: number; angle?: number; penumbra?: number; decay?: number });

/**
 * Componente de luz genérico para ECS.
 * - ambient: no requiere transform
 * - directional/point/spot: usan position/rotation del Transform de la entity
 */
export class LightComponent extends Component {
  readonly type = 'light';
  readonly metadata: ComponentMetadata = {
    type: 'light',
    unique: true,
    requires: [], // Transform es opcional para ambient
    conflicts: []
  };

  private _params: LightParams;

  constructor(params: LightParams) {
    super();
    this._params = params;
  }

  get params(): LightParams {
    return this._params;
  }

  set params(value: LightParams) {
    this._params = value;
    this.notifyChanged();
  }

  setColor(color: string | number): void {
    this._params = { ...this._params, color } as LightParams;
    this.notifyChanged();
  }

  setIntensity(intensity: number): void {
    this._params = { ...this._params, intensity } as LightParams;
    this.notifyChanged();
  }
}

export default LightComponent;
