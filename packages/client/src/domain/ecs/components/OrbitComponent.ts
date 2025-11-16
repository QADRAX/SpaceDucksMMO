import { Component } from '../core/Component';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export type OrbitPlane = 'xz' | 'xy' | 'yz';

export class OrbitComponent extends Component {
  readonly type = 'orbit';
  readonly metadata: ComponentMetadata = { type: 'orbit', unique: true, requires: [], conflicts: [] };
  targetEntityId: string; altitudeFromSurface: number; speed: number; orbitPlane: OrbitPlane; angle = 0;
  constructor(params: { targetEntityId: string; altitudeFromSurface: number; speed: number; orbitPlane?: OrbitPlane }) {
    super(); this.targetEntityId = params.targetEntityId; this.altitudeFromSurface = params.altitudeFromSurface; this.speed = params.speed; this.orbitPlane = params.orbitPlane ?? 'xz'; }
  updateAngle(dt: number){ this.angle += this.speed * dt; }
}

export default OrbitComponent;