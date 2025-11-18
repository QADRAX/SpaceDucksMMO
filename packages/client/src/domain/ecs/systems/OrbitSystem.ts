import type { Entity } from '../core/Entity';
import { OrbitComponent } from '../components/OrbitComponent';
import BaseGeometryComponent from '../components/BaseGeometryComponent';

export class OrbitSystem {
  constructor(private entities: Map<string, Entity>) {}
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      const orbit = entity.getComponent<OrbitComponent>('orbit');
      if (!orbit || (orbit as any).enabled === false) continue;
      const target = this.entities.get(orbit.targetEntityId); if (!target) continue;
      // Effective radius: ask whichever concrete geometry component the entity has
      let targetRadius = 1;
      const geomComp = target.getAllComponents().find((c) => c instanceof BaseGeometryComponent) as BaseGeometryComponent | undefined;
      if (geomComp) {
        targetRadius = geomComp.getBoundingRadius(target.transform.worldScale);
      }
      const orbitDistance = targetRadius + orbit.altitudeFromSurface;
      orbit.updateAngle(dt);
      const tp = target.transform.worldPosition;
      let x = tp.x, y = tp.y, z = tp.z;
      switch (orbit.orbitPlane) {
        case 'xz': x += Math.cos(orbit.angle)*orbitDistance; z += Math.sin(orbit.angle)*orbitDistance; break;
        case 'xy': x += Math.cos(orbit.angle)*orbitDistance; y += Math.sin(orbit.angle)*orbitDistance; break;
        case 'yz': y += Math.cos(orbit.angle)*orbitDistance; z += Math.sin(orbit.angle)*orbitDistance; break;
      }
      entity.transform.setPosition(x,y,z);
    }
  }
}

export default OrbitSystem;