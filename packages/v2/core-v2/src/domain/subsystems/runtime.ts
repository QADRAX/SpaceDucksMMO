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

/**
 * Creates a merged port registry: reads from scene first, then engine; writes to scene only.
 * Used so scene subsystems (e.g. physics) register ports per scene and consumers (e.g. scripting)
 * resolve the port for their scene without passing sceneId.
 */
export function createMergedPortRegistry(
  sceneRegistry: SubsystemPortRegistry,
  engineRegistry: SubsystemPortRegistry
): SubsystemPortRegistry {
  return {
    get<T>(def: PortDefinition<T>): T | undefined {
      const fromScene = sceneRegistry.get(def);
      if (fromScene !== undefined) return fromScene;
      return engineRegistry.get(def);
    },
    getById<T = unknown>(id: string): T | undefined {
      const fromScene = sceneRegistry.getById<T>(id);
      if (fromScene !== undefined) return fromScene;
      return engineRegistry.getById<T>(id);
    },
    register<T>(def: PortDefinition<T>, implementation: T): void {
      sceneRegistry.register(def, implementation);
    },
    has<T>(def: PortDefinition<T>): boolean {
      return sceneRegistry.has(def) || engineRegistry.has(def);
    },
    entries(): ReadonlyArray<readonly [PortDefinition<any>, unknown]> {
      const sceneEntries = sceneRegistry.entries();
      const engineEntries = engineRegistry.entries();
      const sceneIds = new Set(sceneEntries.map(([def]) => def.id));
      const engineOnly = engineEntries.filter(([def]) => !sceneIds.has(def.id));
      return [...sceneEntries, ...engineOnly];
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
  const sceneRegistry = createSubsystemPortRegistry(
    scene.scenePorts,
    scene.scenePortDefinitions as Map<string, PortDefinition<any>>
  );
  const engineRegistry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions
  );
  const ports = createMergedPortRegistry(sceneRegistry, engineRegistry);
  return factories.map((factory) => factory({ engine, scene, ports }));
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
