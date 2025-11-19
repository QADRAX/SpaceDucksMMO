import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";
import BaseGeometryComponent from "./BaseGeometryComponent";

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
        {
          key: "targetEntityId",
          label: "Target",
          get: (c: OrbitComponent) => c.targetEntityId,
          set: (c, v) => {
            c.targetEntityId = String(v || "");
            c.notifyChanged();
          },
        },
        {
          key: "altitudeFromSurface",
          label: "Altitude",
          get: (c: OrbitComponent) => c.altitudeFromSurface,
          set: (c, v) => {
            c.altitudeFromSurface = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "speed",
          label: "Speed",
          get: (c: OrbitComponent) => c.speed,
          set: (c, v) => {
            c.speed = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "orbitPlane",
          label: "Plane",
          get: (c: OrbitComponent) => c.orbitPlane,
          set: (c, v) => {
            c.orbitPlane = String(v) as any;
            c.notifyChanged();
          },
        },
        {
          key: "initialAngle",
          label: "Initial Angle",
          get: (c: OrbitComponent) => c.initialAngle,
          set: (c, v) => {
            c.initialAngle = Number(v);
            // also sync runtime angle to the configured initialAngle
            c.angle = c.initialAngle ?? 0;
            c.notifyChanged();
          },
        },
      ],
    },
  };
  targetEntityId: string;
  altitudeFromSurface: number;
  speed: number;
  orbitPlane: OrbitPlane;
  /** runtime angle in radians */
  angle = 0;
  /** configured initial angle (radians) shown in inspector */
  initialAngle?: number;
  constructor(params: {
    targetEntityId: string;
    altitudeFromSurface: number;
    speed: number;
    orbitPlane?: OrbitPlane;
    initialAngle?: number;
  }) {
    super();
    this.targetEntityId = params.targetEntityId;
    this.altitudeFromSurface = params.altitudeFromSurface;
    this.speed = params.speed;
    this.orbitPlane = params.orbitPlane ?? "xz";
    this.initialAngle = params.initialAngle ?? 0;
    this.angle = this.initialAngle;
  }
  updateAngle(dt: number) {
    // dt is passed as milliseconds from the main loop (performance.now delta).
    // Interpret `speed` as radians per second, so convert dt to seconds.
    const secs = dt / 1000;
    this.angle += this.speed * secs;
  }
  update(dt: number): void {
    if (!this.enabled) return;
    const world = getCurrentEcsWorld();
    if (!world) return;

    const target = world.getEntity(this.targetEntityId);
    if (!target) return;

    const selfId = this.getEntityId();
    if (!selfId) return;
    const self = world.getEntity(selfId);
    if (!self) return;

    // determine target radius from first geometry component
    let targetRadius = 1;
    const geomComp = target
      .getAllComponents()
      .find((c) => c instanceof BaseGeometryComponent) as
      | BaseGeometryComponent
      | undefined;
    if (geomComp) {
      const ws = target.transform.worldScale;
      targetRadius = geomComp.getBoundingRadius({ x: ws.x, y: ws.y, z: ws.z });
    }

    const orbitDistance = targetRadius + this.altitudeFromSurface;

    this.updateAngle(dt);
    const a = this.angle;
    const tp = target.transform.worldPosition;
    let x = tp.x,
      y = tp.y,
      z = tp.z;

    if (this.orbitPlane === "xz") {
      x = tp.x + Math.cos(a) * orbitDistance;
      z = tp.z + Math.sin(a) * orbitDistance;
      // y stays at target.y
    } else if (this.orbitPlane === "xy") {
      x = tp.x + Math.cos(a) * orbitDistance;
      y = tp.y + Math.sin(a) * orbitDistance;
    } else if (this.orbitPlane === "yz") {
      y = tp.y + Math.cos(a) * orbitDistance;
      z = tp.z + Math.sin(a) * orbitDistance;
    }

    self.transform.setPosition(x, y, z);
  }
}

export default OrbitComponent;
