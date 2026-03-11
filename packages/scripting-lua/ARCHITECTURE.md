# @duckengine/scripting-lua — Architecture (4+1 Model)

This document describes the actual architecture of the Lua scripting subsystem using Kruchten's **4+1** model. The goal is to be honest about how the system is built today, not how it ideally should be.

---

## Relationship with core-v2

This package is a **scene subsystem adapter** (SceneSubsystem). It depends on `@duckengine/core-v2`; core-v2 never depends on it. It registers as a scene subsystem via `defineSceneSubsystem` and connects to the engine lifecycle through events and `onUpdate`.

**Ports from core**: `SceneEventBusProviderPort` (internal, auto-registered) provides the event bus per scene via `getOrCreateEventBus(sceneId)`. `UISlotOperationsPort` (internal) enables `Scene.addUISlot`, `removeUISlot`, `updateUISlot` from Lua. Both are available after `api.setup()`.

---

## 4+1 Model: The Four Views + Scenarios

### Logical View

Main domain abstractions:

```mermaid
flowchart LR
    subgraph Session["ScriptingSessionState"]
        Slots[(slots)]
        Pending[(pending)]
        SB[sandbox]
        BR[bridges]
        PT[ports]
        EB[eventBus]
        TS[timeState]
    end

    subgraph Slot["ScriptSlotState"]
        EID[entityId]
        SID[scriptId]
        Props[properties]
        Dirty[dirtyKeys]
        Handle[sandboxHandle]
    end

    subgraph SandboxAPI["ScriptSandbox"]
        Create[createSlot]
        Hook[callHook]
        Sync[syncProperties]
        Flush[flushDirtyProperties]
        Destroy[destroySlot]
    end

    Slots --> Slot
    Session --> SandboxAPI
```

| Concept | Description |
|---------|-------------|
| **ScriptSlotState** | State of a script instance: entityId, scriptId, properties, dirtyKeys, sandboxHandle, declared hooks. |
| **ScriptSandbox** | Port that abstracts Lua execution (createSlot, callHook, syncProperties, flushDirtyProperties, destroySlot). |
| **ScriptBridgeContext** | Context injected per slot: Transform, Scene, Script, references, etc. |
| **BridgeDeclaration** | Factory that creates a bridge from ports and state (inputBridge, physicsBridge, gizmoBridge, timeBridge, etc.). |
| **SceneEventBus** | In-frame event bus for script-to-script communication (fire/on, flush). Provided by core's `SceneEventBusProviderPort.getOrCreateEventBus(sceneId)`. |
| **ScriptingSessionState** | Global session state: slots, pending, sandbox, bridges, ports, eventBus, sceneId, sceneEventBusProvider, timeState, resolvers. |

**Entity-scoped bridges**: Transform, Scene, Script are scoped per entityId. Input, Gizmo, Physics, Time are global and live in `Engine.*`.

**BridgePorts**: Resolved from `SubsystemRuntimeState` at session init. Includes `physicsQuery`, `gizmo`, `input`, `uiSlotOperations`. `uiSlotOperations` is an internal port (core provides default); scripting gets it after `api.setup()`.

**Custom ports**: `engine_ports['port-id']` is resolved from `SubsystemRuntimeState` (portDefinitions + ports). Async methods accept a callback as the last argument: `callback(err, result)`.

---

### Process View

Runtime execution flows:

```mermaid
flowchart TB
    subgraph Events["Engine events"]
        A[component-changed script]
        B[onUpdate each frame]
        C[entity-removed]
        D[scene-teardown / dispose]
    end

    subgraph Reconcile["reconcileSlots"]
        R1[initScriptSlot async]
        R2[resolveSource + resolveScriptSchema]
        R3[createSlot → init → onEnable]
        R4[destroyScriptSlot if removed]
    end

    subgraph Frame["runFrameHooks"]
        F1[timeState]
        F2[bindComponentAccessors]
        F3[Sync ECS → Lua]
        F4[earlyUpdate]
        F5[eventBus.flush]
        F6[update, lateUpdate, onDrawGizmos]
        F7[flushDirtyProperties]
        F8[flushDirtySlotsToScene]
    end

    subgraph Destroy["destroyEntitySlots"]
        D1[onDisable → onDestroy]
        D2[destroySlot]
    end

    subgraph Teardown["teardownSession"]
        T1[onDisable → onDestroy]
        T2[slots.clear]
        T3[eventBus.dispose]
        T4[provider.unregisterSceneBus]
    end

    A --> Reconcile
    B --> Frame
    C --> Destroy
    D --> Teardown
```

**Note**: `syncProperties` is an exported use case but is not wired to the subsystem lifecycle. The actual ECS → Lua sync happens inside `runFrameHooks`. `syncProperties` is useful for tests or manual invocation.

---

### Development View

Code organization:

```
src/
├── domain/                    # Business logic, types, ports
│   ├── slots/                 # ScriptSlotState, createScriptSlot, initScriptSlot,
│   │                          # destroyScriptSlot, runHookOnAllSlots, syncSlotPropertiesFromScene,
│   │                          # flushDirtySlotsToScene, slotKey
│   ├── properties/            # diffProperties, applyPropertyChanges, normalizePropertyValue
│   ├── bridges/               # BridgeDeclaration, factory, resolveRuntimeBridgeTable (engine_ports)
│   │   ├── inputBridge, physicsBridge, gizmoBridge, timeBridge, transformBridge,
│   │   ├── sceneBridge, scriptsBridge, bridgeContext
│   ├── session/               # initializeScriptRuntime, createScriptingSession,
│   │                          # ScriptingSessionState (eventBus, sceneId, sceneEventBusProvider)
│   ├── ports/                 # ScriptSandbox (interface)
│   ├── componentAccessors/    # createComponentAccessorPair (ECS getter/setter)
│   ├── schemas/               # builtInSchemas
│   └── subsystems/            # defineSubsystemUseCase (local)
│
├── application/               # Use cases
│   ├── reconcileSlots        # component-changed → init/destroy slots
│   ├── destroyEntitySlots    # entity-removed → destroy slots
│   ├── runFrameHooks          # onUpdate → hook pipeline + sync
│   ├── syncProperties         # (standalone) ECS → Lua for all slots
│   └── teardownSession        # scene-teardown / dispose → full cleanup
│
└── infrastructure/            # Concrete implementations
    ├── scriptingSubsystem.ts  # createScriptingSubsystem → defineSceneSubsystem
    ├── wasmoon/               # createWasmoonSandbox (Lua 5.4 via WASM)
    │   ├── wasmoonSandbox.ts  # Implements ScriptSandbox
    │   ├── modules/           # sandboxSecurity, sandboxMetatables, sandboxRuntime, mathExt
    │   └── luaUtils.ts        # callLuaGlobal
    ├── resourceScriptResolver.ts
    ├── createBuiltInScriptResolver.ts
    ├── createBuiltInScriptSchemaResolver.ts
    └── builtin/               # move_to_point, waypoint_path
```

**Dependency rule**:
- `domain` does not import from `application` or `infrastructure`
- `application` does not import from `infrastructure`
- `infrastructure` imports from `domain` and `application`

---

### Physical View

```mermaid
flowchart TB
    subgraph DuckEngine["DuckEngine (Node process)"]
        subgraph Core["@duckengine/core-v2"]
            C1[defineSceneSubsystem]
            C2[SceneState]
            C3[EventBus]
        end

        subgraph Scripting["@duckengine/scripting-lua"]
            subgraph Subsystem["SceneSubsystem"]
                S1[ScriptingSessionState]
                S2[bridgePorts, resourceLoader]
                S3[reconcileSlots]
                S4[destroyEntitySlots]
                S5[teardownSession]
                S6[runFrameHooks]
            end
            subgraph Wasmoon["wasmoon"]
                W1[Lua 5.4 WASM]
                W2[1 instance per session]
            end
        end
    end

    Subsystem --> Core
    Subsystem --> Wasmoon
```

---

## Scenarios (+1): Use Cases

Scenarios tie the views together and explain the system's behavior.

### UC-1: Entity with script added to scene

1. User adds a `script` component with `scripts: [{ scriptId, enabled, properties }]`
2. core-v2 emits `component-changed` (script)
3. `reconcileSlots` receives the event
4. For each new script: `initScriptSlot` (async)
   - `resolveSource(scriptId)` and `resolveScriptSchema(scriptId)` (ResourceLoader or builtin)
   - `createScriptSlot` + `sandbox.createSlot` (compiles Lua, creates context)
   - `sandbox.callHook(key, 'init', 0)` and `sandbox.callHook(key, 'onEnable', 0)`
5. Slot is stored in `slots` and ready for the next frame

```mermaid
sequenceDiagram
    participant User as User/Editor
    participant Core as core-v2
    participant Reconcile as reconcileSlots
    participant Init as initScriptSlot
    participant Resolver as ResourceLoader
    participant Sandbox as ScriptSandbox
    participant Lua as Lua VM

    User->>Core: addComponent(script, { scripts: [...] })
    Core->>Core: component-changed (script)
    Core->>Reconcile: event
    Reconcile->>Init: initScriptSlot (async)
    Init->>Resolver: resolveSource + resolveScriptSchema
    Resolver-->>Init: source, schema
    Init->>Sandbox: createSlot(key, source, bridges, props)
    Sandbox->>Lua: doString + __CreateSlot
    Init->>Sandbox: callHook(init)
    Sandbox->>Lua: init(self)
    Init->>Sandbox: callHook(onEnable)
    Init->>Reconcile: slots.set(key, slot)
```

### UC-2: Update frame

1. core-v2 calls the subsystem's `onUpdate` with `{ scene, dt }`
2. `runFrameHooks` executes:
   - Updates `timeState`
   - `syncSlotPropertiesFromScene`: diff ECS vs slot.properties → `sandbox.syncProperties` → `onPropertyChanged` if changed
   - `runHookOnAllSlots('earlyUpdate', dt)`
   - `eventBus.flush()` (delivers queued events)
   - `runHookOnAllSlots('update', dt)`, `lateUpdate`, `onDrawGizmos`
   - `sandbox.flushDirtyProperties` → `flushDirtySlotsToScene` (Lua → ECS)

```mermaid
sequenceDiagram
    participant Core as core-v2
    participant RFH as runFrameHooks
    participant Slots as domain/slots
    participant Sandbox as ScriptSandbox
    participant Lua as Lua VM

    Core->>RFH: onUpdate({ scene, dt })
    RFH->>RFH: timeState.delta = dt
    loop For each slot
        RFH->>Slots: syncSlotPropertiesFromScene
        Slots->>Sandbox: syncProperties(slotKey, props)
        Sandbox->>Lua: __UpdateProperty
        opt If changed
            Sandbox->>Lua: callHook(onPropertyChanged)
        end
    end
    RFH->>Sandbox: callHook(earlyUpdate)
    Sandbox->>Lua: init/update/...
    RFH->>RFH: eventBus.flush()
    RFH->>Sandbox: callHook(update, lateUpdate, onDrawGizmos)
    loop For each slot
        RFH->>Sandbox: flushDirtyProperties(slotKey)
        Sandbox->>Lua: __FlushDirtyProperties
        Lua-->>Sandbox: dirty { key: value }
        RFH->>Slots: flushDirtySlotsToScene
    end
```

### UC-3: Script calls async port with callback

1. In `init` or `update`, the script calls `engine_ports['game:api'].fetchData('id', function(err, data) ... end)`
2. `resolveRuntimeBridgeTable` exposes the method wrapped with `wrapAsyncWithCallback`
3. The wrapper detects 2+ args, uses the last as callback
4. `fn(id)` returns a `Promise` → `callback(undefined, result)` on resolve
5. The Lua callback runs in a microtask; writes to `self.properties`; the next frame flushes to ECS

### UC-4: Entity removed

1. core-v2 emits `entity-removed`
2. `destroyEntitySlots` receives the event
3. For each slot of the entity: `onDisable` → `onDestroy` → `sandbox.destroySlot` → `eventBus.removeSlot`
4. Slots removed from `slots`

### UC-5: Scene teardown

1. core-v2 emits `scene-teardown` or calls `dispose`
2. `teardownSession` executes
3. For each slot: `onDisable` → `onDestroy` → `sandbox.destroySlot`
4. `slots.clear()`, `eventBus.dispose()`
5. `sceneEventBusProvider.unregisterSceneBus(sceneId)` — releases the bus from the provider

---

## Dependency Summary

```mermaid
flowchart TB
    subgraph Infra["infrastructure"]
        I1[scriptingSubsystem]
        I2[wasmoon]
    end

    subgraph App["application"]
        A1[reconcileSlots]
        A2[destroyEntitySlots]
        A3[runFrameHooks]
        A4[teardownSession]
    end

    subgraph Domain["domain"]
        D1[slots]
        D2[properties]
        D3[events]
        D4[bridges]
        D5[session]
        D6[ports]
    end

    subgraph Core["@duckengine/core-v2"]
        C1[types]
        C2[defineSceneSubsystem]
        C3[defineSubsystemUseCase]
    end

    Infra --> App
    Infra --> Domain
    App --> Domain
    Domain --> Core
```

---

## Notes

> Caveats and implementation details that may surprise developers.

**syncProperties** — The `syncProperties` use case is exported but not wired to the subsystem lifecycle. The actual ECS → Lua sync happens inside `runFrameHooks` (step 3). Use `syncProperties` for tests or when you need to sync without running the full frame pipeline.

**Bridges** — Bridge declarations are pure factory functions in domain. Infrastructure calls them with the correct ports; bridges do not hold state or orchestrate workflows.

**engine_ports** — Custom ports are resolved at runtime from `SubsystemRuntimeState` (portDefinitions + port implementations). There are no static types per port for clients; each game extends `engine_ports_v2.d.lua` with its own port shapes.

**Lua VM** — One wasmoon (Lua 5.4) instance per session. All slots share the same VM; isolation is by `slotKey` (context tables, metatables), not by separate VMs.

**Event bus** — The event bus is `SceneEventBus` from core. scripting-lua obtains it via `SceneEventBusProviderPort.getOrCreateEventBus(sceneId)` at session init. On teardown, `unregisterSceneBus(sceneId)` is called so the provider can dispose the bus.
