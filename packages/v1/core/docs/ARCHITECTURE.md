# Duck Engine Core - Architecture Overview

## Introduction

`@duckengine/core` is the foundational package of the Duck Engine, a modular game engine designed with a clear separation of concerns. This package is **renderer-agnostic** and **physics-agnostic**, providing the core abstractions and systems that orchestrate the game engine.

## Design Philosophy

### Separation of Concerns

The core package follows a **layered architecture** inspired by Clean Architecture and Domain-Driven Design:

- **Domain Layer**: Core business logic, ECS, scripting, and abstractions (ports)
- **Application Layer**: Orchestration services (e.g., TextureResolverService)
- **Infrastructure Layer**: Concrete implementations of domain abstractions (e.g., BaseScene)

### Renderer & Physics Agnostic

The core package **must never** depend on specific rendering engines (like Three.js) or physics engines (like Rapier). Instead:

- **Ports** (interfaces) define contracts (e.g., `IRenderingEngine`, `IPhysicsSystem`)
- **Adapters** in separate packages (e.g., `@duckengine/rendering-three`, `@duckengine/physics-rapier`) implement these ports

This allows the engine to support multiple rendering backends and physics engines without changing core logic.

## Package Structure

```
packages/core/
├── src/
│   ├── domain/              # Core domain logic (business rules)
│   │   ├── ecs/             # Entity-Component-System
│   │   │   ├── core/        # Entity, Component, Transform, etc.
│   │   │   └── components/  # Built-in components (Camera, Mesh, Lights, etc.)
│   │   ├── scripting/       # Lua scripting system & sandbox
│   │   │   ├── bridge/      # JavaScript ↔ Lua API bridges
│   │   │   └── generated/   # Auto-generated script assets
│   │   ├── physics/         # Physics abstractions & collision events
│   │   ├── ports/           # Interfaces for external dependencies
│   │   ├── assets/          # Texture catalog & asset types
│   │   ├── scene/           # Scene change events
│   │   ├── settings/        # Game settings contracts
│   │   ├── logging/         # Core logger
│   │   └── errors/          # Error handling utilities
│   ├── application/         # Application services (orchestration)
│   │   └── TextureResolverService.ts
│   └── infrastructure/      # Infrastructure implementations
│       ├── scenes/          # BaseScene implementation
│       └── assets/          # WebCoreTextureCatalogService
├── res/
│   └── scripts/             # Lua scripts (system, builtin, types)
│       ├── system/          # Sandbox runtime & security
│       ├── builtin/         # Built-in behaviors (movement, camera, etc.)
│       └── types/           # Lua type definitions (.d.lua)
└── scripts/
    └── generate-scripts.ts  # Build-time script bundling
```

## Core Systems

### 1. Entity-Component-System (ECS)

The ECS is the backbone of Duck Engine's object model. See [ECS.md](./ECS.md) for details.

**Key Concepts**:
- **Entity**: A unique ID with a transform and a collection of components
- **Component**: A data container with optional behavior (e.g., `MeshComponent`, `ScriptComponent`)
- **System**: External logic that operates on entities with specific components (e.g., `ScriptSystem`, `RenderSyncSystem`)

**Core Classes**:
- `Entity` - Scene graph node with parent-child hierarchy
- `Component` - Base class for all components
- `Transform` - Local & world-space position, rotation, scale
- `ComponentFactory` - Creates components from type strings

### 2. Lua Scripting System

The scripting system allows developers to define entity behavior in Lua. See [SCRIPTING.md](./SCRIPTING.md) for details.

**Key Features**:
- **Sandboxed Execution**: User scripts run in a secure Lua environment (no file system access)
- **Hook-based Lifecycle**: Scripts define `init`, `update`, `lateUpdate`, `onCollision`, etc.
- **Type-safe Bridges**: JavaScript APIs are exposed via typed bridges (Transform, Physics, Scene, etc.)
- **Hot Reload**: Scripts can be modified and reloaded without restarting the engine

**Architecture**:
- `ScriptSystem` - Main orchestrator
- `ScriptRuntime` - Manages the Lua engine instance
- `ScriptInstanceManager` - Compiles and stores script instances
- `ScriptBridgeRegistry` - Registers JavaScript APIs in Lua
- `ScriptLifecycleOrchestrator` - Executes hooks (earlyUpdate, update, lateUpdate)

### 3. Scene Management

**BaseScene** is the abstract base class for all scenes:
- Manages a collection of entities (`Map<string, Entity>`)
- Initializes physics and rendering systems
- Coordinates the script system lifecycle
- Handles debug flags (transform gizmos, colliders, etc.)

**Scene Lifecycle**:
1. `onEnter()` - Scene activation (setup entities, init scripts)
2. `update(dt)` - Per-frame update (scripts, physics, rendering)
3. `onExit()` - Scene cleanup (destroy entities, unload resources)

### 4. Physics System

The physics system is abstracted via the `IPhysicsSystem` interface. Concrete implementations (e.g., Rapier) live in separate packages.

**Key Components**:
- `CollisionEventsHub` - Event bus for collision events (enter, exit, stay)
- `RigidBodyComponent` - Defines physics properties (mass, friction, restitution)
- `ColliderComponent` - Defines collision shapes (box, sphere, mesh)
- `PhysicsContext` - Injected into entities for script access to physics APIs

### 5. Rendering System

Rendering is abstracted via `IRenderingEngine` and `IRenderSyncSystem`.

**Rendering Flow**:
1. **RenderSyncSystem** observes component changes (via `IComponentObserver`)
2. When a component changes, RenderSyncSystem updates the corresponding render objects
3. **IRenderingEngine** handles the actual rendering (implemented by `@duckengine/rendering-three`)

**Key Components**:
- `MeshComponent` - Geometry + Material
- `CameraViewComponent` - Camera settings (FOV, near/far planes)
- `LightComponent` (Directional, Point, Spot) - Lighting

### 6. Asset System

Assets (textures, models, scripts) are resolved via:
- `ITextureResolver` - Resolves texture paths to URLs
- `TextureCatalogService` - Provides texture variants (diffuse, normal, roughness, etc.)
- `AssetResolver` (in scripts) - Resolves generic resources from URLs or IDs

## Dependency Injection & Inversion of Control

The core package defines **ports** (interfaces) for external dependencies:

```typescript
// Domain Ports (abstractions)
export interface IRenderingEngine { /* ... */ }
export interface IPhysicsSystem { /* ... */ }
export interface ITextureResolver { /* ... */ }
export interface ISettingsService { /* ... */ }
```

Concrete implementations are **injected** at runtime by higher-level packages:

```typescript
// Example: Client package injects ThreeJS renderer
import { ThreeRenderingEngine } from '@duckengine/rendering-three';
import { RapierPhysicsSystem } from '@duckengine/physics-rapier';

const scene = new MyScene();
scene.setup(renderingEngine, physicsSystem, settingsService, textureCatalog);
```

This inversion of control allows:
- **Testing**: Mock implementations for unit tests
- **Flexibility**: Swap rendering/physics engines without changing core logic
- **Modularity**: Each system is independently replaceable

## Event-Driven Architecture

### Component Observer Pattern

Components notify observers when they change:

```typescript
class MyComponent extends Component {
  set value(v: number) {
    this._value = v;
    this.notifyChanged(); // Triggers observer updates
  }
}
```

`RenderSyncSystem` implements `IComponentObserver` to react to changes:

```typescript
onComponentChanged(entityId: string, componentType: ComponentType) {
  // Update corresponding render object
}
```

### Scene Event Bus

The scripting system provides a global event bus for cross-entity communication:

```lua
-- Fire a custom event
Scene.fireEvent("player_died", { playerId = "player_1" })

-- Subscribe to events
function update(dt)
  Scene.onEvent(self, "player_died", function(data)
    log.info("Script", "Player died: " .. data.playerId)
  end)
end
```

### Collision Events

Physics collision events are centralized via `CollisionEventsHub`:

```typescript
collisionEvents.on('collision-enter', (event) => {
  // Handle collision
});
```

Scripts can subscribe via the `onCollision` hook:

```lua
function onCollision(other)
  log.info("Script", "Collided with: " .. other.id)
end
```

## Error Handling

The core package uses a **Result monad** pattern for error handling:

```typescript
// Instead of throwing exceptions:
safeAddComponent(component: Component): Result<void> {
  if (errors.length) {
    return err('invalid-component', message, { errors });
  }
  return ok(undefined);
}
```

This provides:
- **Explicit error handling** (no silent failures)
- **Structured error data** (code, message, context)
- **Better testability** (errors are values, not exceptions)

## Performance Considerations

### Entity Hierarchy

Entities form a **scene graph** (parent-child tree):
- Transform calculations use **world-space caching**
- Children transforms are updated only when parent changes

### Script Compilation

Lua scripts are compiled once and cached:
- Scripts are parsed and stored in Lua global tables (`__Contexts`, `__SlotHooks`)
- Hook execution uses direct Lua function calls (no re-parsing)

### Component Updates

Components define an optional `update(dt)` method, but:
- Most components are **data-only** (no update logic)
- Systems (e.g., `ScriptSystem`, `PhysicsSystem`) drive updates externally
- This keeps component logic minimal and predictable

## Extension Points

### Custom Components

Create custom components by extending `Component`:

```typescript
import { Component, ComponentMetadata } from '@duckengine/core';

export class MyComponent extends Component {
  readonly type = "my_component";
  readonly metadata: ComponentMetadata = {
    type: "my_component",
    label: "My Component",
    description: "Custom component logic",
    category: "Gameplay",
    icon: "Zap",
    unique: false,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        { key: "value", label: "Value", type: "number", defaultValue: 0 }
      ]
    }
  };
  
  value = 0;
}
```

### Custom Lua Bridges

Expose new JavaScript APIs to Lua:

```typescript
import type { LuaEngine } from 'wasmoon';
import type { BridgeContext } from '@duckengine/core';

export function registerMyBridge(engine: LuaEngine, ctx: BridgeContext) {
  const myApi = {
    doSomething: (entityId: string) => {
      const ent = ctx.getEntity(entityId);
      // Custom logic
    }
  };
  engine.global.set("MyAPI", myApi);
}
```

### Custom Systems

Create systems by implementing domain interfaces or extending base classes:

```typescript
import { IComponentObserver } from '@duckengine/core';

class MySystem implements IComponentObserver {
  onComponentChanged(entityId: string, componentType: ComponentType) {
    // React to component changes
  }
}
```

## Testing Strategy

### Unit Tests

The core package uses **Jest** for unit testing:
- **Component tests**: Validate data integrity and observer notifications
- **Entity tests**: Test hierarchy manipulation, component addition/removal
- **Script tests**: Mock Lua engine for scripting logic

### Integration Tests

Integration tests validate cross-system behavior:
- **Scripting integration**: Load real Lua scripts and verify hook execution
- **Physics integration**: Simulate collisions and verify event propagation
- **ECS integration**: Create entities, add components, verify observer updates

### Test Utilities

The package provides test scaffolding:
- `SceneTestScaffold` - Sets up a minimal scene for testing
- Mock implementations of ports (e.g., `MockPhysicsSystem`)

## Key Dependencies

- **wasmoon**: Lua runtime for JavaScript (WebAssembly-based)
- **TypeScript**: Type-safe development
- **Jest**: Testing framework

## Next Steps

For detailed documentation on specific systems:

- [ECS System & Entity Composition](./ECS.md)
- [Lua Scripting System & Sandbox](./SCRIPTING.md)
- [Scripting Guide & API Reference](./SCRIPTING_GUIDE.md)
- [Component Reference](./COMPONENTS.md)
- [System Flows & Diagrams](./FLOWS.md)
