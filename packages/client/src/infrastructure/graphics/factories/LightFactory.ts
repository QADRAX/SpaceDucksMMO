import * as THREE from 'three';
import type { Entity } from '../../../domain/ecs/core/Entity';
import type { LightComponent } from '../../../domain/ecs/components/LightComponent';

export class LightFactory {
  static build(entity: Entity, lightComp: LightComponent, scene: THREE.Scene): THREE.Light {
    const p = lightComp.params;
    let light: THREE.Light;

    switch (p.type) {
      case 'ambient':
        light = new THREE.AmbientLight(
          (p.color as any) ?? 0xffffff,
          p.intensity ?? 0.5
        );
        break;

      case 'directional': {
        const dir = new THREE.DirectionalLight(
          (p.color as any) ?? 0xffffff,
          p.intensity ?? 1.0
        );
        const forward = entity.transform.getForward();
        const wp = entity.transform.worldPosition;
        const targetPos = new THREE.Vector3(wp.x, wp.y, wp.z).add(
          new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
        );
        dir.position.set(wp.x, wp.y, wp.z);
        dir.target.position.copy(targetPos);
        scene.add(dir.target);
        light = dir;
        break;
      }

      case 'point': {
        const point = new THREE.PointLight(
          (p.color as any) ?? 0xffffff,
          p.intensity ?? 1.0,
          (p as any).distance ?? 0,
          (p as any).decay ?? 1
        );
        const pwp = entity.transform.worldPosition;
        point.position.set(pwp.x, pwp.y, pwp.z);
        light = point;
        break;
      }

      case 'spot': {
        const spot = new THREE.SpotLight(
          (p.color as any) ?? 0xffffff,
          p.intensity ?? 1.0,
          (p as any).distance ?? 0,
          (p as any).angle ?? Math.PI / 6,
          (p as any).penumbra ?? 0.0,
          (p as any).decay ?? 1
        );
        const swp = entity.transform.worldPosition;
        spot.position.set(swp.x, swp.y, swp.z);
        const forward = entity.transform.getForward();
        const targetPos = new THREE.Vector3(swp.x, swp.y, swp.z).add(
          new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
        );
        spot.target.position.copy(targetPos);
        scene.add(spot.target);
        light = spot;
        break;
      }

      default:
        light = new THREE.AmbientLight(0xffffff, 0.3);
        break;
    }

    return light;
  }

  static updateDirectionalTarget(light: THREE.DirectionalLight | THREE.SpotLight, entity: Entity): void {
    const forward = entity.transform.getForward();
    const wp = entity.transform.worldPosition;
    const targetPos = new THREE.Vector3(wp.x, wp.y, wp.z).add(
      new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
    );
    light.target.position.copy(targetPos);
  }
}
