import * as THREE from 'three';
import type { Entity } from './Entity';
import { CameraTargetComponent } from './CameraTargetComponent';

/**
 * Sistema que actualiza cámaras con CameraTargetComponent.
 * Hace que la cámara siga y mire hacia la entity target.
 */
export class CameraTargetSystem {
  private entities: Map<string, Entity>;

  constructor(entities: Map<string, Entity>) {
    this.entities = entities;
  }

  /**
   * Actualiza todas las cámaras que tienen CameraTargetComponent.
   */
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      const targetComp = entity.getComponent<CameraTargetComponent>('cameraTarget');
      if (!targetComp) continue;

      const targetEntity = this.entities.get(targetComp.targetEntityId);
      if (!targetEntity) {
        console.warn(`CameraTargetComponent: target entity '${targetComp.targetEntityId}' not found`);
        continue;
      }

      // Obtener posición del target
      let targetPos = targetEntity.transform.worldPosition.clone();
      if (targetComp.lookAtOffset) {
        targetPos.add(targetComp.lookAtOffset);
      }

      // Actualizar posición de la cámara (smooth follow) solo si hay offset definido
      if (targetComp.followSpeed !== undefined && targetComp.offset) {
        const cameraPos = entity.transform.worldPosition;
        const desiredPos = targetPos.clone();
        desiredPos.add(targetComp.offset);

        // Lerp hacia la posición deseada
        const newPos = cameraPos.clone().lerp(desiredPos, targetComp.followSpeed * dt);
        entity.transform.setPosition(newPos.x, newPos.y, newPos.z);
      }

      // Hacer que la cámara mire al target
      entity.transform.lookAt(targetPos);
    }
  }
}

export default CameraTargetSystem;
