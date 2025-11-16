import * as THREE from 'three';
import type { Entity } from './Entity';
import { OrbitComponent } from './OrbitComponent';

/**
 * Sistema que actualiza entities con OrbitComponent.
 * Mueve las entities en órbitas circulares alrededor de sus targets.
 */
export class OrbitSystem {
  private entities: Map<string, Entity>;

  constructor(entities: Map<string, Entity>) {
    this.entities = entities;
  }

  /**
   * Actualiza todas las órbitas.
   */
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      const orbit = entity.getComponent<OrbitComponent>('orbit');
      if (!orbit) continue;

      const target = this.entities.get(orbit.targetEntityId);
      if (!target) {
        console.warn(`OrbitComponent: target entity '${orbit.targetEntityId}' not found`);
        continue;
      }

      // Calcular radio efectivo del target
      const targetRadius = orbit.calculateTargetRadius(target);

      // Calcular distancia orbital = radio + altitud
      const orbitDistance = targetRadius + orbit.altitudeFromSurface;

      // Actualizar ángulo
      orbit.updateAngle(dt);

      // Calcular nueva posición según el plano de órbita
      const targetPos = target.transform.worldPosition;
      let x = targetPos.x;
      let y = targetPos.y;
      let z = targetPos.z;

      switch (orbit.orbitPlane) {
        case 'xz': // órbita horizontal (defecto)
          x += Math.cos(orbit.angle) * orbitDistance;
          z += Math.sin(orbit.angle) * orbitDistance;
          break;

        case 'xy': // órbita en plano XY
          x += Math.cos(orbit.angle) * orbitDistance;
          y += Math.sin(orbit.angle) * orbitDistance;
          break;

        case 'yz': // órbita en plano YZ
          y += Math.cos(orbit.angle) * orbitDistance;
          z += Math.sin(orbit.angle) * orbitDistance;
          break;
      }

      // Actualizar posición de la entity
      entity.transform.setPosition(x, y, z);
    }
  }
}

export default OrbitSystem;
