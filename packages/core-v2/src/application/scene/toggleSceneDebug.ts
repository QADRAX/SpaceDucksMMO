import type { DebugKind } from '../../domain/ecs';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/** Parameters for the toggleSceneDebug use case. */
export interface ToggleSceneDebugParams {
  readonly kind: DebugKind;
  readonly enabled: boolean;
}

/** Enables or disables a scene-wide debug visualisation kind. */
export const toggleSceneDebug = defineSceneUseCase<ToggleSceneDebugParams, void>({
  name: 'toggleSceneDebug',
  execute(scene, { kind, enabled }) {
    scene.debugFlags.set(kind, enabled);

    if (kind === 'mesh') {
      emitSceneChange(scene, { kind: 'scene-mesh-debug-changed', enabled });
    } else if (kind === 'collider') {
      emitSceneChange(scene, { kind: 'scene-collider-debug-changed', enabled });
    } else {
      emitSceneChange(scene, { kind: 'scene-debug-changed', kindName: kind, enabled });
    }
  },
});
