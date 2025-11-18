import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export type OrbitPlane = "xz" | "xy" | "yz";

export class OrbitComponent extends Component {
  readonly type = "orbit";
  readonly metadata: ComponentMetadata = {
    type: "orbit",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        { key: "targetEntityId", label: "Target", get: (c: OrbitComponent) => c.targetEntityId, set: (c, v) => { c.targetEntityId = String(v || ""); c.notifyChanged(); } },
        { key: "altitudeFromSurface", label: "Altitude", get: (c: OrbitComponent) => c.altitudeFromSurface, set: (c, v) => { c.altitudeFromSurface = Number(v); c.notifyChanged(); } },
        { key: "speed", label: "Speed", get: (c: OrbitComponent) => c.speed, set: (c, v) => { c.speed = Number(v); c.notifyChanged(); } },
        { key: "orbitPlane", label: "Plane", get: (c: OrbitComponent) => c.orbitPlane, set: (c, v) => { c.orbitPlane = String(v) as any; c.notifyChanged(); } },
        { key: "angle", label: "Angle", get: (c: OrbitComponent) => c.angle },
      ],
    },
  };
  targetEntityId: string;
  altitudeFromSurface: number;
  speed: number;
  orbitPlane: OrbitPlane;
  angle = 0;
  constructor(params: {
    targetEntityId: string;
    altitudeFromSurface: number;
    speed: number;
    orbitPlane?: OrbitPlane;
  }) {
    super();
    this.targetEntityId = params.targetEntityId;
    this.altitudeFromSurface = params.altitudeFromSurface;
    this.speed = params.speed;
    this.orbitPlane = params.orbitPlane ?? "xz";
  }
  updateAngle(dt: number) {
    this.angle += this.speed * dt;
  }
}

export default OrbitComponent;
