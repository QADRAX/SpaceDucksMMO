import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { PhysicsWorldHandle } from '../domain/types';

export const disposePhysics = defineSubsystemUseCase<PhysicsWorldHandle, void, void>({
  name: 'disposePhysics',
  execute(state) {
    state.dispose();
  },
});
