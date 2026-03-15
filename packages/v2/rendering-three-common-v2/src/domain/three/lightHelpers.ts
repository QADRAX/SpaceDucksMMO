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
  if (dir) return { type: 'directionalLight', color: parseColor(dir.color), intensity: dir.intensity, castShadow: dir.castShadow ?? false };

  const point = getComponent<PointLightComponent>(entity, 'pointLight');
  if (point) return { type: 'pointLight', color: parseColor(point.color), intensity: point.intensity, distance: point.distance ?? 0, decay: point.decay ?? 2, castShadow: point.castShadow ?? false };

  const spot = getComponent<SpotLightComponent>(entity, 'spotLight');
  if (spot) return { type: 'spotLight', color: parseColor(spot.color), intensity: spot.intensity, distance: spot.distance ?? 0, angle: spot.angle ?? Math.PI / 3, penumbra: spot.penumbra ?? 0, castShadow: spot.castShadow ?? false };

  return null;
}

/** Cache key so we only recreate the light when params actually changed. */
export function lightParamsKey(p: LightParams): string {
  const base = `${p.type}:${p.color}:${p.intensity}:`;
  if (p.type === 'ambientLight') return base;
  if (p.type === 'directionalLight') return base + p.castShadow;
  if (p.type === 'pointLight') return base + `${p.distance}:${p.decay}:${p.castShadow}`;
  return base + `${p.distance}:${p.angle}:${p.penumbra}:${p.castShadow}`;
}
