import * as THREE from "three";
import type {
  Entity,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
} from "@duckengine/ecs";

export type AnyLightComponent =
  | AmbientLightComponent
  | DirectionalLightComponent
  | PointLightComponent
  | SpotLightComponent;

export class LightFactory {
  static build(
    entity: Entity,
    lightComp: AnyLightComponent,
    scene: THREE.Scene
  ): THREE.Light {
    switch (lightComp.type) {
      case "ambientLight": {
        const c = lightComp as AmbientLightComponent;
        return new THREE.AmbientLight(
          (c.color as any) ?? 0xffffff,
          c.intensity ?? 1
        );
      }

      case "directionalLight": {
        const c = lightComp as DirectionalLightComponent;
        const dir = new THREE.DirectionalLight(
          (c.color as any) ?? 0xffffff,
          c.intensity ?? 1
        );
        dir.castShadow = c.castShadow ?? false;

        // Shadows: Three.js defaults for DirectionalLight use a small orthographic
        // shadow camera (roughly +/-5 units). In the editor this often results in
        // some objects casting shadows (near origin) while others don't (outside
        // the shadow frustum). Provide a conservative-but-useful default.
        if (dir.castShadow) {
          try {
            dir.shadow.mapSize.set(2048, 2048);
            // Slight bias to reduce acne.
            (dir.shadow as any).bias = -0.0001;
            (dir.shadow as any).normalBias = 0.02;

            const cam = dir.shadow.camera as any;
            // Orthographic camera for directional shadows
            cam.left = -25;
            cam.right = 25;
            cam.top = 25;
            cam.bottom = -25;
            cam.near = 0.1;
            cam.far = 200;
            cam.updateProjectionMatrix?.();
          } catch {
            // best-effort only
          }
        }

        const forward = entity.transform.getForward();
        const wp = entity.transform.worldPosition;
        const targetPos = new THREE.Vector3(wp.x, wp.y, wp.z).add(
          new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
        );
        dir.position.set(wp.x, wp.y, wp.z);
        dir.target.position.copy(targetPos);
        scene.add(dir.target);

        return dir;
      }

      case "pointLight": {
        const c = lightComp as PointLightComponent;
        const point = new THREE.PointLight(
          (c.color as any) ?? 0xffffff,
          c.intensity ?? 1,
          c.distance ?? 0,
          c.decay ?? 1
        );
        const wp = entity.transform.worldPosition;
        point.position.set(wp.x, wp.y, wp.z);
        return point;
      }

      case "spotLight": {
        const c = lightComp as SpotLightComponent;
        const spot = new THREE.SpotLight(
          (c.color as any) ?? 0xffffff,
          c.intensity ?? 1,
          c.distance ?? 0,
          c.angle ?? Math.PI / 6,
          c.penumbra ?? 0,
          c.decay ?? 1
        );
        const wp = entity.transform.worldPosition;
        spot.position.set(wp.x, wp.y, wp.z);

        const forward = entity.transform.getForward();
        const targetPos = new THREE.Vector3(wp.x, wp.y, wp.z).add(
          new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
        );
        spot.target.position.copy(targetPos);
        scene.add(spot.target);

        if ((spot as any).castShadow) {
          try {
            spot.shadow.mapSize.set(2048, 2048);
            (spot.shadow as any).bias = -0.0001;
            (spot.shadow as any).normalBias = 0.02;
            // For SpotLight, camera is perspective; far should cover typical scenes.
            const cam = spot.shadow.camera as any;
            cam.near = 0.1;
            cam.far = 200;
            cam.updateProjectionMatrix?.();
          } catch {
            // best-effort only
          }
        }

        return spot;
      }

      default: {
        // Fail-safe: unknown light type -> simple ambient light.
        // Old LightComponent is not supported anymore (no params usage).
        return new THREE.AmbientLight(0xffffff, 0.3);
      }
    }
  }

  static updateDirectionalTarget(
    light: THREE.DirectionalLight | THREE.SpotLight,
    entity: Entity
  ): void {
    const forward = entity.transform.getForward();
    const wp = entity.transform.worldPosition;
    const targetPos = new THREE.Vector3(wp.x, wp.y, wp.z).add(
      new THREE.Vector3(forward.x, forward.y, forward.z).multiplyScalar(10)
    );
    light.target.position.copy(targetPos);
  }
}

export default LightFactory;
