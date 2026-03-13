import type { EngineState } from '../engine';
import type { SceneChangeListener, SceneState } from '../scene';
import type {
  SubsystemPortRegistry,
  SceneSubsystemFactory,
  SceneSubsystem,
  SubsystemRuntimeState,
  PortDefinition,
} from './types';

/** Name of the subsystem runtime bag on EngineState. */
export const SUBSYSTEM_RUNTIME_KEY = 'subsystemRuntime';

/** Creates an empty subsystem runtime state. */
export function createSubsystemRuntimeState(): SubsystemRuntimeState {
  return {
    sceneSubsystemFactories: [],
    portDerivers: [],
    ports: new Map(),
    portDefinitions: new Map(),
  };
}

/** Creates a strongly-typed port registry wrapper over a map. */
export function createSubsystemPortRegistry(
  ports: Map<string, unknown>,
  definitions: Map<string, PortDefinition<any>>
): SubsystemPortRegistry {
  return {
    get<T>(def: PortDefinition<T>): T | undefined {
      return ports.get(def.id) as T | undefined;
    },
    getById<T = unknown>(id: string): T | undefined {
      return ports.get(id) as T | undefined;
    },
    register<T>(def: PortDefinition<T>, implementation: T): void {
      ports.set(def.id, implementation);
      definitions.set(def.id, def);
    },
    has<T>(def: PortDefinition<T>): boolean {
      return ports.has(def.id);
    },
    entries(): ReadonlyArray<readonly [PortDefinition<any>, unknown]> {
      return Array.from(definitions.values()).map((def) => [def, ports.get(def.id)!]);
    },
  };
}

/** Runs all registered port derivation hooks in registration order. */
export function runSubsystemPortDerivers(engine: EngineState): void {
  const registry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions
  );
  for (const deriver of engine.subsystemRuntime.portDerivers) {
    deriver({ engine, ports: registry });
  }
}

/** Builds a set of scene subsystems from the provided factories. */
export function instantiateSceneSubsystems(
  engine: EngineState,
  scene: SceneState,
  factories: ReadonlyArray<SceneSubsystemFactory>,
): SceneSubsystem[] {
  const registry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions
  );
  return factories.map((factory) => factory({ engine, scene, ports: registry }));
}

/** Attaches one scene subsystem to update and event channels. */
export function attachSceneSubsystem(scene: SceneState, subsystem: SceneSubsystem): void {
  scene.subsystems.push(subsystem);
  const listener: SceneChangeListener = (s, ev) => subsystem.handleSceneEvent(s, ev);
  scene.changeListeners.add(listener);
}

/** Attaches many scene subsystems in-order. */
export function attachSceneSubsystems(
  scene: SceneState,
  subsystems: ReadonlyArray<SceneSubsystem>,
): void {
  for (const subsystem of subsystems) {
    attachSceneSubsystem(scene, subsystem);
  }
}
