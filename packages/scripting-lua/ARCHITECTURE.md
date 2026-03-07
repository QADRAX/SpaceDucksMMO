# @duckengine/scripting-lua Architecture Guide

This document defines the architectural structure, design principles, and guidelines for `@duckengine/scripting-lua`. The package follows the same **Clean Architecture** principles as `@duckengine/core-v2`, adapted for the scripting domain.

## Relationship with core-v2

This package is an **external system adapter** — analogous to `rendering-three` and `physics-rapier`. It depends on `@duckengine/core-v2` but core-v2 **never** depends on it.

| Concern | Where it lives |
|---|---|
| `SceneSystemAdapter`, `SceneState`, `EntityState`, `TransformState`, types shared across the engine | `@duckengine/core-v2` (imported as external dependency) |
| `ScriptHook`, `ScriptSlotState`, `BridgeDeclaration`, script lifecycle logic, bridge factories | `@duckengine/scripting-lua/domain` |
| Use cases that orchestrate domain functions for consumer actions | `@duckengine/scripting-lua/application` |
| `ScriptSandbox` port, Lua modules, wasmoon adapter, mock adapter | `@duckengine/scripting-lua/infrastructure` (port interface in `domain/ports`) |

**Rule**: Any type or function that is _general to the engine_ (entities, scenes, transforms, components) stays in core-v2. Any type or function _specific to scripting_ (hooks, slots, bridges, sandbox, Lua modules) lives here.

---

## Layer Overview

### 1. Domain Layer (`src/domain/`)

**Purpose**: Core scripting logic — types, pure functions, and port interfaces. Zero external dependencies beyond `@duckengine/core-v2` types.

- **Rules**:
  - Functions must be pure: they compute or mutate _only_ the state passed to them.
  - No side effects, no I/O, no runtime-specific code.
  - Port interfaces (`domain/ports/`) define contracts that infrastructure implements.
  - Types and logic are separated within each module (see Feature Modules below).

### 2. Application Layer (`src/application/`)

**Purpose**: Contains **only Use Cases**. Each use case is a named, domain-tagged operation following the `UseCase<TState, TParams, TOutput>` pattern from core-v2.

- **Rules**:
  - **Only use cases live here**. No generic functions, no factories, no types (beyond use-case params interfaces).
  - A use case orchestrates domain pure functions — it never implements business logic directly.
  - Use cases may read from ports but never implement them.
  - Each use case file exports a single `const` created via a `define*UseCase` helper.

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Implements the Domain Ports using external libraries (wasmoon/WASM, test mocks).

- **Rules**:
  - Acts as adapters connecting ports to concrete implementations.
  - Infrastructure depends on Domain, but never vice versa.
  - Lua script templates (security, metatables, runtime, math extensions) live under `wasmoon/modules/`.
  - The `SceneSystemAdapter` factory (`createScriptingAdapter`) lives here — it wires domain logic, ports, and sandbox into the core-v2 adapter contract.

---

## Domain Feature Modules

The domain is organized into **feature modules**, each following core-v2's feature-sliced pattern:

```text
src/domain/
    ├── slots/                 # Script instance lifecycle
    │   ├── types.ts           # ScriptHook, ScriptSlotState, FRAME_HOOKS, LIFECYCLE_ORDER
    │   ├── slots.ts           # createScriptSlot(), slotKey()
    │   └── index.ts
    │
    ├── properties/            # ECS ↔ Lua property synchronization
    │   ├── properties.ts      # diffProperties(), applyPropertyChanges(), shallowEqual()
    │   └── index.ts
    │
    ├── events/                # In-frame script-to-script communication
    │   ├── types.ts           # ScriptEventBus, ScriptEventEntry, ScriptEventSubscription
    │   ├── eventBus.ts        # createScriptEventBus()
    │   └── index.ts
    │
    ├── bridges/               # Bridge declarations and factories
    │   ├── types.ts           # BridgeDeclaration, BridgeFactory, BridgePorts,
    │   │                      # PhysicsQueryLike, GizmoLike, InputStateLike,
    │   │                      # ScriptBridgeContext, TimeState
    │   ├── transformBridge.ts # Transform bridge factory (calls core-v2 domain fns)
    │   ├── sceneBridge.ts     # Scene bridge factory (entity views, component access, events)
    │   ├── physicsBridge.ts   # Physics bridge factory (proxies PhysicsQueryLike)
    │   ├── inputBridge.ts     # Input bridge factory (proxies InputStateLike)
    │   ├── timeBridge.ts      # Time bridge factory + createTimeState()
    │   ├── gizmoBridge.ts     # Gizmo bridge factory (proxies GizmoLike)
    │   ├── bridgeContext.ts   # createScriptBridgeContext() — composes bridges per entity
    │   └── index.ts
    │
    ├── ports/                 # Contracts for infrastructure (dependency inversion)
    │   ├── scriptSandbox.ts   # ScriptSandbox interface
    │   └── index.ts
    │
    └── index.ts               # Root domain barrel
```

Each module keeps **types.ts** (data shapes + interfaces) separate from **logic files** (pure functions). If a module's types are minimal (< 30 lines), they can inline into the logic file — but as soon as they grow, extract them.

### Why bridges are domain, not application

Bridges are **pure factory functions** that compose a scoped API from domain functions and port proxies. They don't orchestrate multi-step workflows, they don't depend on infrastructure, and they don't carry state. They are domain logic — the same way `setPosition(transform, x, y, z)` is domain logic in core-v2.

---

## Application Use Cases

Use cases follow the typed `UseCase<TState, TParams, TOutput>` pattern, with a `define*UseCase` helper that tags them with a domain discriminator. Expected use cases:

| Use Case | State | Description |
|---|---|---|
| `initScriptSlot` | `ScriptSlotState` | Create and initialize a script slot for an entity |
| `destroyScriptSlot` | `ScriptSlotState` | Teardown lifecycle (onDisable, onDestroy, cleanup) |
| `syncSlotProperties` | `ScriptSlotState` | Diff ECS → Lua properties, push into sandbox |
| `runFrameHooks` | `ScriptSlotState[]` | Execute per-frame hook pipeline (earlyUpdate → update → lateUpdate → drawGizmos) |
| `reconcileScriptSlots` | `SceneState` | Diff desired vs actual slots for an entity after component-changed |
| `enableSlot` / `disableSlot` | `ScriptSlotState` | Toggle slot enabled state with lifecycle hooks |

Each use case:
1. Lives in `src/application/<useCaseName>.ts`
2. Exports a single `const` via `defineScriptUseCase(...)` or similar helper
3. Has a co-located `<useCaseName>.test.ts`

---

## Infrastructure Adapters

### ScriptSandbox Port

```text
domain/ports/scriptSandbox.ts   → ScriptSandbox interface
infrastructure/mock/            → createMockSandbox() (JS-based, for tests)
infrastructure/wasmoon/         → createWasmoonSandbox() (Lua 5.4 via WASM)
```

### Scripting Adapter

The `createScriptingAdapter()` factory lives in **infrastructure** because it:
- Wires together domain logic + sandbox port + bridge factories
- Returns a `SceneSystemAdapter` (core-v2 contract)
- Manages async initialization (script source resolution)
- Holds mutable internal state (slot registry, pending inits)

This is not a use case — it's the infrastructure composition root for this package.

```text
infrastructure/
    ├── scriptingAdapter.ts     # createScriptingAdapter() → SceneSystemAdapter
    ├── scriptSandbox.ts        # (deprecated ← moved to domain/ports/)
    ├── mock/
    │   ├── mockSandbox.ts
    │   └── index.ts
    └── wasmoon/
        ├── wasmoonSandbox.ts
        ├── modules/
        │   ├── sandboxSecurity.ts
        │   ├── sandboxMetatables.ts
        │   ├── sandboxRuntime.ts
        │   ├── mathExt.ts
        │   └── index.ts
        └── index.ts
```

---

## Feature Development Flow

1. **Define Types**: Model state shapes in `domain/<module>/types.ts`
2. **Implement Pure Logic**: Write functions in `domain/<module>/` with co-located tests
3. **Define Use Cases**: Create an Application Use Case in `application/` that orchestrates the domain functions. One file per use case.
4. **Define Ports** (if needed): Add the interface to `domain/ports/`
5. **Implement Adapters**: Provide concrete implementations in `infrastructure/`

---

## Dependency Direction

```
infrastructure/ ──depends-on──▶ application/ ──depends-on──▶ domain/
                                                                │
                                                      imports types from
                                                                │
                                                      @duckengine/core-v2
```

Domain never imports from application or infrastructure.
Application never imports from infrastructure.
Infrastructure may import from both domain and application.
