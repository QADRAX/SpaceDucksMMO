import { createSceneSubsystem, DiagnosticPortDef } from '@duckengine/core-v2';
import { createPhysicsWorldState } from './createPhysicsWorldState';
import { createPhysicsQueryPortImpl } from './physicsQueryPortImpl';
import { physicsQueryPortDef } from './physicsQueryPortDef';
import { addEntityToPhysics, removeEntityFromPhysics, onComponentChangedPhysics, onHierarchyChangedPhysics, stepPhysics, disposePhysics } from '../application';
import { reconcilePendingPhysicsForKey } from '../application/reconcilePendingPhysicsForKey';
import type { PhysicsWorldState } from './types';

/**
 * Creates the scene subsystem factory for Rapier physics.
 * Register via api.setup({ sceneSubsystems: [createPhysicsSubsystem()] }).
 * Each scene gets its own Rapier World and registers the PhysicsQueryPort with id 'io:physics-query'
 * in the scene's port registry (merged with engine ports), so scripting resolves the correct scene's physics.
 * All logging is routed through the engine's diagnostic port (no console.*).
 */
export function createPhysicsSubsystem() {
  return createSceneSubsystem<PhysicsWorldState>({
    id: 'physics-rapier',
    createState(ctx) {
      const diagnostic = ctx.ports.get(DiagnosticPortDef);
      const state = createPhysicsWorldState({
        diagnostic: diagnostic ?? undefined,
        sceneId: ctx.scene.id,
      });
      const impl = createPhysicsQueryPortImpl(state);
      ctx.ports.register(physicsQueryPortDef, impl);
      return state;
    },
    events: {
      'entity-added': addEntityToPhysics,
      'entity-removed': removeEntityFromPhysics,
      'component-changed': onComponentChangedPhysics,
      'hierarchy-changed': onHierarchyChangedPhysics,
    },
    engineEvents: {
      'resource-loaded': reconcilePendingPhysicsForKey,
    },
    phases: {
      physics: stepPhysics,
    },
    dispose: disposePhysics,
  });
}
