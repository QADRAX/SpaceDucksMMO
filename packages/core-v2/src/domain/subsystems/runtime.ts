import type { EngineState } from '../engine';
import type { SceneChangeListener, SceneState } from '../scene';
import type {
  SubsystemPortDeriver,
  SubsystemPortRegistry,
  SceneSubsystemFactory,
  SceneSubsystem,
} from './types';

/** Internal mutable subsystem runtime bag stored on EngineState. */
export interface SubsystemRuntimeState {
  readonly sceneSubsystemFactories: SceneSubsystemFactory[];
  readonly portDerivers: SubsystemPortDeriver[];
  readonly ports: Map<string, unknown>;
}

/** Creates an empty subsystem runtime state. */
export function createSubsystemRuntimeState(): SubsystemRuntimeState {
  return {
    sceneSubsystemFactories: [],
    portDerivers: [],
    ports: new Map(),
  };
}

/** Creates a strongly-typed port registry wrapper over a map. */
export function createSubsystemPortRegistry(ports: Map<string, unknown>): SubsystemPortRegistry {
  return {
    get<T = unknown>(key: string): T | undefined {
      return ports.get(key) as T | undefined;
    },
    set<T = unknown>(key: string, value: T): void {
      ports.set(key, value);
    },
    has(key: string): boolean {
      return ports.has(key);
    },
    entries(): ReadonlyArray<readonly [string, unknown]> {
      return Array.from(ports.entries());
    },
  };
}

/** Runs all registered port derivation hooks in registration order. */
export function runSubsystemPortDerivers(engine: EngineState): void {
  const registry = createSubsystemPortRegistry(engine.subsystemRuntime.ports);
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
  const registry = createSubsystemPortRegistry(engine.subsystemRuntime.ports);
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
