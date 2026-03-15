import {
  getComponent,
  type EntityState,
  type AmbientLightComponent,
  type DirectionalLightComponent,
  type PointLightComponent,
  type SpotLightComponent,
} from '@duckengine/core-v2';
import type { LightParams } from '../lightFromParams';
import { parseColor } from '../parseColor';

export function getLightParamsFromEntity(entity: EntityState): LightParams | null {
  const ambient = getComponent<AmbientLightComponent>(entity, 'ambientLight');
  if (ambient) return { type: 'ambientLight', color: parseColor(ambient.color), intensity: ambient.intensity };

  const dir = getComponent<DirectionalLightComponent>(entity, 'directionalLight');
  if (dir) return { type: 'directionalLight', color: parseColor(dir.color), intensity: dir.intensity, castShadow: dir.castShadow ?? false, shadowMapSize: dir.shadowMapSize, shadowBias: dir.shadowBias, shadowNormalBias: dir.shadowNormalBias, shadowCameraLeft: dir.shadowCameraLeft, shadowCameraRight: dir.shadowCameraRight, shadowCameraTop: dir.shadowCameraTop, shadowCameraBottom: dir.shadowCameraBottom, shadowCameraNear: dir.shadowCameraNear, shadowCameraFar: dir.shadowCameraFar };

  const point = getComponent<PointLightComponent>(entity, 'pointLight');
  if (point) return { type: 'pointLight', color: parseColor(point.color), intensity: point.intensity, distance: point.distance ?? 0, decay: point.decay ?? 2, castShadow: point.castShadow ?? false, shadowMapSize: point.shadowMapSize, shadowBias: point.shadowBias, shadowNormalBias: point.shadowNormalBias };

  const spot = getComponent<SpotLightComponent>(entity, 'spotLight');
  if (spot) return { type: 'spotLight', color: parseColor(spot.color), intensity: spot.intensity, distance: spot.distance ?? 0, angle: spot.angle ?? Math.PI / 3, penumbra: spot.penumbra ?? 0, castShadow: spot.castShadow ?? false, shadowMapSize: spot.shadowMapSize, shadowBias: spot.shadowBias, shadowNormalBias: spot.shadowNormalBias };

  return null;
}

/** Cache key so we only recreate the light when params actually changed. */
export function lightParamsKey(p: LightParams): string {
  const base = `${p.type}:${p.color}:${p.intensity}:`;
  if (p.type === 'ambientLight') return base;
  if (p.type === 'directionalLight') return base + p.castShadow + `:${p.shadowMapSize}:${p.shadowBias}:${p.shadowNormalBias}:${p.shadowCameraLeft}:${p.shadowCameraRight}:${p.shadowCameraTop}:${p.shadowCameraBottom}:${p.shadowCameraNear}:${p.shadowCameraFar}`;
  if (p.type === 'pointLight') return base + `${p.distance}:${p.decay}:${p.castShadow}:${p.shadowMapSize}:${p.shadowBias}:${p.shadowNormalBias}`;
  return base + `${p.distance}:${p.angle}:${p.penumbra}:${p.castShadow}:${p.shadowMapSize}:${p.shadowBias}:${p.shadowNormalBias}`;
}
