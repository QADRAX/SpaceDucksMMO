import type { EngineState } from '../engine';
import type { SceneChangeListener, SceneState } from '../scene';
import type {
  AdapterPortDeriver,
  AdapterPortRegistry,
  SceneAdapterFactory,
  SceneSystemAdapter,
} from './types';

/** Internal mutable adapter runtime bag stored on EngineState. */
export interface AdapterRuntimeState {
  readonly sceneAdapterFactories: SceneAdapterFactory[];
  readonly portDerivers: AdapterPortDeriver[];
  readonly ports: Map<string, unknown>;
}

/** Creates an empty adapter runtime state. */
export function createAdapterRuntimeState(): AdapterRuntimeState {
  return {
    sceneAdapterFactories: [],
    portDerivers: [],
    ports: new Map(),
  };
}

/** Creates a strongly-typed port registry wrapper over a map. */
export function createAdapterPortRegistry(ports: Map<string, unknown>): AdapterPortRegistry {
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
export function runAdapterPortDerivers(engine: EngineState): void {
  const registry = createAdapterPortRegistry(engine.adapterRuntime.ports);
  for (const deriver of engine.adapterRuntime.portDerivers) {
    deriver({ engine, ports: registry });
  }
}

/** Builds a set of scene adapters from the provided factories. */
export function instantiateSceneAdapters(
  engine: EngineState,
  scene: SceneState,
  factories: ReadonlyArray<SceneAdapterFactory>,
): SceneSystemAdapter[] {
  const registry = createAdapterPortRegistry(engine.adapterRuntime.ports);
  return factories.map((factory) => factory({ engine, scene, ports: registry }));
}

/** Attaches one scene adapter to update and event channels. */
export function attachSceneAdapter(scene: SceneState, adapter: SceneSystemAdapter): void {
  scene.adapters.push(adapter);
  const listener: SceneChangeListener = (s, ev) => adapter.handleSceneEvent(s, ev);
  scene.changeListeners.add(listener);
}

/** Attaches many scene adapters in-order. */
export function attachSceneAdapters(
  scene: SceneState,
  adapters: ReadonlyArray<SceneSystemAdapter>,
): void {
  for (const adapter of adapters) {
    attachSceneAdapter(scene, adapter);
  }
}
