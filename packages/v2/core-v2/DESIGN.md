# @duckengine/core-v2 — Design Document

This document describes how the engine models components, subsystems, and centralized resources. It complements `ARCHITECTURE.md` by focusing on design decisions and intended usage.

---

## 1. Component Model

### 1.1 Base shape

All ECS components share a common base:

```ts
interface ComponentBase<TType, TSelf> {
  readonly type: TType;           // Discriminator (e.g. 'rigidBody', 'script')
  readonly metadata: ComponentMetadata<TSelf>;
  enabled: boolean;
}
```

Components are **plain data objects** — no methods, no observers. Mutation and notification are handled by the entity layer (observers fire on add/remove/change).

### 1.2 Component metadata

Each component carries static metadata that drives validation, inspector UI, and lifecycle rules:

| Field | Purpose |
|-------|---------|
| `type` | Discriminator for the component kind. |
| `label` | Human-readable name for UI. |
| `unique` | When true, at most one instance per entity. |
| `uniqueInScene` | When true, at most one instance across the entire scene (e.g. `gravity`). |
| `requires` | Component types that must exist on the same entity. |
| `requiresInHierarchy` | Component types that must exist on this entity or any ancestor (e.g. colliders require `rigidBody` up the tree). |
| `conflicts` | Component types that cannot coexist on the same entity. |
| `inspector` | Field definitions for the editor UI. |
| `category` | Grouping in the inspector (e.g. "Physics", "Rendering"). |
| `icon` | Icon key for visual representation. |

### 1.3 Component spec and central registry

A **ComponentSpec** links metadata with default values:

```ts
type ComponentSpec<T> = {
  metadata: ComponentMetadata<T>;
  defaults: Omit<T, 'type' | 'metadata' | 'enabled'>;
};
```

All specs live in a central registry (`COMPONENT_SPECS`). `createComponent(type, overrides?)` stamps a new instance by merging defaults and overrides. This ensures every component is created from a single source of truth.

### 1.4 Inspector fields

Inspector metadata defines which fields are editable and how:

```ts
interface InspectorFieldConfig<TComponent, TValue> {
  key: string;                    // Property path (supports dot-notation: 'halfExtents.x')
  label?: string;
  type?: InspectorFieldType;      // 'number' | 'boolean' | 'enum' | 'vector' | 'texture' | ...
  get?: (component: TComponent) => TValue;
  set?: (component: TComponent, value: TValue) => void;
  min?: number; max?: number; step?: number;  // For numeric fields
  options?: EnumOption[];          // For enum fields
  unit?: string;                  // Display suffix (e.g. "m", "°")
}
```

- **Dot-notation paths**: `halfExtents.x`, `heightfield.size.z` — resolved via `getFieldValue` / `setFieldValue`.
- **Custom get/set**: When a field declares `get`/`set`, those are used instead of direct property access (e.g. for computed or validated values).
- **Validation**: `validateFieldValue` checks constraints (type, min/max, enum options) before applying.

### 1.5 Field paths and typing

`ComponentFieldPaths<T>` produces a string-literal union of all editable paths (excluding `type`, `metadata`, `enabled`). This enables type-safe `setField`:

```ts
api.scene('main').entity('e1').component('boxCollider').setField({
  fieldKey: 'halfExtents.x',
  value: 0.5,
});
```

---

## 2. Subsystems

### 2.1 What are subsystems?

Subsystems are **pluggable modules** that extend the engine with domain-specific behaviour. They react to scene events and participate in the frame-update pipeline. The engine does not hard-code rendering, physics, or scripting — these are subsystems registered at setup.

### 2.2 Scene subsystems vs engine subsystems

| Aspect | Scene subsystem | Engine subsystem |
|--------|-----------------|------------------|
| **Scope** | Per scene | Global (all scenes) |
| **Events** | Receives scene events (`entity-added`, `component-changed`, etc.) | No events |
| **Update** | `update(scene, dt)` | `update(engine, dt)` |
| **Use case** | Scripting, physics (per-scene), scene-specific logic | Rendering, audio, cross-scene systems |

**Scene subsystems** are instantiated once per scene. Each scene has its own scripting state, physics world, etc.

**Engine subsystems** run after all scene updates. They typically need full engine visibility (all viewports, all scenes) — e.g. a renderer that composites multiple viewports.

### 2.3 Defining a scene subsystem

Use `defineSceneSubsystem` to declare a subsystem factory:

```ts
const factory = defineSceneSubsystem('scripting-lua')
  .withPorts((registry) => ({
    bridgePorts: resolveBridgePortsFromRegistry(registry),
    resourceLoader: registry.get(ResourceLoaderPortDef),
  }))
  .withState(({ ports, scene, engine }) => initializeScriptRuntime({ ... }))
  .onEvent(reconcileSlots)      // component-changed
  .onEvent(destroyEntitySlots)  // entity-removed
  .onEvent(teardownSession)     // scene-teardown
  .onEarlyUpdate(runEarlyUpdate)
  .onUpdate(runUpdate)
  .onLateUpdate(runLateUpdate)
  .onPreRender(runOnDrawGizmos)
  .onPostRender(runPostRender)
  .onDispose(teardownSession)
  .build();
```

- **withPorts**: Resolves dependencies from the port registry. Subsystems declare what they need; the engine injects implementations at setup.
- **withState**: Creates per-scene state. Receives `{ ports, scene, engine }`.
- **onEvent**: Binds use cases to specific event kinds. When `emitSceneChange` fires, matching handlers run.
- **onEarlyUpdate, onPhysics, onUpdate, onLateUpdate, onPreRender, onPostRender**: Phase callbacks called each frame in fixed order. Scene subsystems have no `render` phase.
- **onDispose**: Called when the scene is torn down.

### 2.4 Integration flow

1. **Setup**: `api.setup({ sceneSubsystems: [factory] })` stores the factory in `subsystemRuntime.sceneSubsystemFactories`.
2. **Scene creation**: When a scene is added, `instantiateSceneSubsystems` runs each factory with `{ engine, scene, ports }` and attaches the resulting `SceneSubsystem` to the scene.
3. **Events**: Entity observers → `emitSceneChange` → `scene.changeListeners` (each subsystem is a listener) → `subsystem.handleSceneEvent(scene, event)`.
4. **Update**: `updateEngine` iterates FRAME_PHASES (earlyUpdate, physics, update, lateUpdate, preRender, render, postRender), calling each subsystem's phase callback when present.
5. **Teardown**: `teardownScene` emits `scene-teardown`, subsystems run `dispose`, listeners are detached.

### 2.5 Port consumption

Subsystems receive a `SubsystemPortRegistry` that provides typed access to ports:

```ts
const physicsQuery = registry.get(PhysicsQueryPortDef);
const resourceLoader = registry.get(ResourceLoaderPortDef);
```

Ports are registered at setup via `customPorts` or `portDerivers`. Port derivers can derive ports from engine state or other ports (e.g. create a derived input port from raw input + settings).

---

## 3. Centralized Resources

### 3.1 Resource model

Resources are **abstract, versioned assets** identified by a semantic key and kind. They are resolved at runtime into concrete data and files. The model is centralized: all resource kinds, data shapes, and file slots are defined in `domain/resources/`.

### 3.2 Resource kinds

Each `ResourceKind` maps to a component type that can be persisted as a resource:

| Kind | Component type | Scalar data | File slots |
|------|----------------|-------------|------------|
| `standardMaterial` | standardMaterial | color, metalness, roughness, ... | albedo, normalMap, aoMap, ... |
| `basicMaterial`, `phongMaterial`, `lambertMaterial` | (same) | color, opacity, ... | albedo |
| `basicShaderMaterial`, `standardShaderMaterial`, `physicalShaderMaterial` | (same) | uniforms, blending, ... | vertexSource, fragmentSource |
| `mesh` | customGeometry, trimeshCollider | — | geometry, thumbnail |
| `skybox` | skybox | — | px, nx, py, ny, pz |
| `script` | script | — | source |
| `texture` | (standalone) | — | image |

### 3.3 Resource reference

```ts
interface ResourceRef<K extends ResourceKind> {
  readonly key: ResourceKey;       // e.g. 'planets/moon-surface'
  readonly kind: K;
  readonly version?: number | 'latest' | 'active';
}
```

Components that reference resources (e.g. `scriptId` in a script reference, `albedo` texture in a material) use `ResourceRef` instead of raw strings. This enables type-safe resolution and versioning.

### 3.4 Resolved resource

The `ResourceLoaderPort.resolve(ref)` returns a `ResolvedResource<K>`:

```ts
interface ResolvedResource<K> {
  readonly key: ResourceKey;
  readonly resourceId: string;
  readonly version: number;
  readonly componentType: K;
  readonly componentData: ResourceData<K>;   // Scalar attributes
  readonly files: Partial<FileSlotsFor<K>>;  // Named file slots (urls, etc.)
}
```

- **componentData**: Strongly-typed scalar attributes for that kind (e.g. `StandardMaterialData`).
- **files**: Named slots (e.g. `albedo`, `model`, `source`) with `ResolvedFile` (url, contentType, etc.).

### 3.5 ResourceLoaderPort

The engine defines the contract; infrastructure implements it:

```ts
interface ResourceLoaderPort {
  resolve<K>(ref: ResourceRef<K>): Promise<Result<ResolvedResource<K>>>;
  fetchFile(url: string, format: 'text' | 'blob'): Promise<Result<string | Blob>>;
}
```

Implementations can resolve from:
- Web-core API (remote assets)
- Local filesystem
- Bundled assets
- CDN URLs

The scripting subsystem uses `resolve` for script sources and `fetchFile` for loading Lua files. Other subsystems (rendering, etc.) use the same port for materials, meshes, textures.

### 3.6 Centralization benefits

- **Single source of truth**: Resource kinds, data shapes, and file slots are defined once in domain.
- **Type safety**: `ResourceRef<K>` and `ResolvedResource<K>` are strongly typed per kind.
- **Pluggable resolution**: Games swap implementations (web API, local, mock) without changing domain.
- **Consistent versioning**: `version` supports caching and rollback.

---

## 4. Ports and Custom Extensions

### 4.1 definePort pattern

Ports are capability interfaces that subsystems consume. They are defined with a schema so the engine can introspect them (e.g. for scripting bridges):

```ts
const MyPortDef = definePort<MyPort>('game:my-port')
  .addMethod('doSomething')
  .addMethod('fetchData', { async: true })
  .build();

// Bind implementation at setup
api.setup({ customPorts: [MyPortDef.bind(myImpl)] });
```

- **id**: Unique string (e.g. `'resourceLoader'`, `'game:analytics'`).
- **methods**: Name + optional `{ async: true }` for Promise-returning methods.
- **bind(impl)**: Creates a `PortBinding` for registration.

### 4.2 Port registry

At setup, ports are stored in `subsystemRuntime.ports` and `portDefinitions`. Scene subsystem factories receive a `SubsystemPortRegistry` and resolve ports by definition:

```ts
registry.get(ResourceLoaderPortDef)  // → ResourceLoaderPort | undefined
registry.getById('game:analytics')   // → unknown (dynamic lookup)
```

### 4.3 Port derivers

Port derivers run during setup and can register or override ports:

```ts
const deriver: SubsystemPortDeriver = ({ engine, ports }) => {
  const base = ports.get(InputPortDef);
  if (base) {
    ports.register(DerivedInputPortDef, createDerivedInput(base, engine.settings));
  }
};

api.setup({ portDerivers: [deriver] });
```

Useful for creating derived ports (e.g. sensitivity-adjusted input) or ports that depend on engine state.

---

## 5. Summary

| Concept | Design intent |
|---------|----------------|
| **Components** | Plain data + metadata. Central spec registry. Inspector-driven validation and dot-notation paths. |
| **Scene subsystems** | Per-scene, event-driven + update pipeline. Declare ports, react to ECS changes. |
| **Engine subsystems** | Global, update-only. For cross-scene systems (render, audio). |
| **Resources** | Abstract refs (key + kind + version) → resolved data + files. Central kinds and shapes. |
| **ResourceLoaderPort** | Single contract for resolution. Pluggable impl (web, local, bundled). |
| **Ports** | definePort + bind. Registry injects into subsystems. Derivers for dynamic ports. |
