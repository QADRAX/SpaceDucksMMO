import type { Vec3Like } from '../math';
import type { SceneState } from '../scene';
import { getComponent } from '../entities';
import type { GravityComponent } from '../components';

/** Default gravity when no gravity component exists in the scene. Y-down. */
export const DEFAULT_GRAVITY: Vec3Like = { x: 0, y: -9.81, z: 0 };

/** Default fixed physics step in seconds (e.g. 1/60). */
export const DEFAULT_FIXED_STEP = 1 / 60;

/** Default maximum substeps per frame to avoid spiral of death. */
export const DEFAULT_MAX_SUBSTEPS = 5;

/** Maximum delta to add to accumulator per frame (avoids spiral of death on large dt). */
export const MAX_ACCUMULATOR_DT = 0.25;

/**
 * Resolves gravity vector from scene entities.
 * Returns the first enabled gravity component's (x,y,z), or DEFAULT_GRAVITY if none.
 */
export function resolveSceneGravity(scene: SceneState): Vec3Like {
  for (const entity of scene.entities.values()) {
    const g = getComponent<GravityComponent>(entity, 'gravity');
    if (g && g.enabled !== false) {
      return { x: g.x, y: g.y, z: g.z };
    }
  }
  return { ...DEFAULT_GRAVITY };
}
