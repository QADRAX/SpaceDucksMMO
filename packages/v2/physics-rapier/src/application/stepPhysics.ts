import type { SubsystemUpdateParams, SubsystemUseCase } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain';

/**
 * Runs one physics step (fixed timestep, sync ECS ↔ Rapier, drain collisions).
 */
export const stepPhysics: SubsystemUseCase<PhysicsWorldHandle, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<PhysicsWorldHandle, SubsystemUpdateParams, void>({
    name: 'physics/stepPhysics',
    execute(state, params) {
      state.step(params.scene, params.dt);
    },
  });
