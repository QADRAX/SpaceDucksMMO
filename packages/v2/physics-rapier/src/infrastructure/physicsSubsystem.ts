import { createSceneSubsystem } from '@duckengine/core-v2';
import { createPhysicsWorldState } from './createPhysicsWorldState';
import { createPhysicsQueryPortImpl } from './physicsQueryPortImpl';
import { physicsQueryPortDef } from './physicsQueryPortDef';
import { addEntityToPhysics, removeEntityFromPhysics, onComponentChangedPhysics, stepPhysics, disposePhysics } from '../application';
import type { PhysicsWorldState } from './types';

/**
 * Creates the scene subsystem factory for Rapier physics.
 * Register via api.setup({ sceneSubsystems: [createPhysicsSubsystem()] }).
 * Each scene gets its own Rapier World and registers the PhysicsQueryPort with id 'io:physics-query'
 * in the scene's port registry (merged with engine ports), so scripting resolves the correct scene's physics.
 */
export function createPhysicsSubsystem() {
  return createSceneSubsystem<PhysicsWorldState>({
    id: 'physics-rapier',
    createState(ctx) {
      const state = createPhysicsWorldState();
      const impl = createPhysicsQueryPortImpl(state);
      ctx.ports.register(physicsQueryPortDef, impl);
      return state;
    },
    events: {
      'entity-added': addEntityToPhysics,
      'entity-removed': removeEntityFromPhysics,
      'component-changed': onComponentChangedPhysics,
    },
    phases: {
      physics: stepPhysics,
    },
    dispose: disposePhysics,
  });
}
