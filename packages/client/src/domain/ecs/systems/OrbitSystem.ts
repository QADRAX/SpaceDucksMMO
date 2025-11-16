import type { Entity } from '../core/Entity';
import { OrbitComponent } from '../components/OrbitComponent';
import { GeometryComponent } from '../components/GeometryComponent';

export class OrbitSystem {
  constructor(private entities: Map<string, Entity>) {}
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      const orbit = entity.getComponent<OrbitComponent>('orbit');
      if (!orbit || (orbit as any).enabled === false) continue;
      const target = this.entities.get(orbit.targetEntityId); if (!target) continue;
      // Effective radius (simplified: sphere/box only)
      const geom = target.getComponent<GeometryComponent>('geometry');
      let targetRadius = 1;
      if (geom) {
        const p = geom.parameters;
        if (p.type === 'sphere') targetRadius = p.radius * target.transform.worldScale.x;
        else if (p.type === 'box') targetRadius = Math.sqrt(p.width*p.width + p.height*p.height + p.depth*p.depth)/2 * target.transform.worldScale.x;
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