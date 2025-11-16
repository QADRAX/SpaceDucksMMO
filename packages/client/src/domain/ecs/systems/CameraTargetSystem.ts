import type { Entity } from '../core/Entity';
import { CameraTargetComponent } from '../components/CameraTargetComponent';

export class CameraTargetSystem {
  constructor(private entities: Map<string, Entity>) {}
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      const targetComp = entity.getComponent<CameraTargetComponent>('cameraTarget');
      if (!targetComp || (targetComp as any).enabled === false) continue;
      const targetEntity = this.entities.get(targetComp.targetEntityId); if (!targetEntity) continue;
      let targetPos = targetEntity.transform.worldPosition.clone();
      if (targetComp.lookAtOffset) targetPos.add({ x: targetComp.lookAtOffset[0], y: targetComp.lookAtOffset[1], z: targetComp.lookAtOffset[2] } as any);
      if (targetComp.followSpeed !== undefined && targetComp.offset) {
        const desired = targetPos.clone().add({ x: targetComp.offset[0], y: targetComp.offset[1], z: targetComp.offset[2] } as any);
        const current = entity.transform.worldPosition.clone();
        const newPos = current.lerp(desired, targetComp.followSpeed * dt);
        entity.transform.setPosition(newPos.x, newPos.y, newPos.z);
      }
      entity.transform.lookAt(targetPos);
    }
  }
}

export default CameraTargetSystem;