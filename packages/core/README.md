# @duckengine/core

Core engine interfaces and reusable base abstractions for Duck Engine.

This package is **renderer-agnostic** and **physics-agnostic**, providing the foundational systems that orchestrate the game engine.

## What is Duck Engine Core?

Duck Engine Core is the heart of the Duck Engine game framework. It provides:

- **Entity-Component-System (ECS)** - Flexible entity composition and scene graph
- **Lua Scripting System** - Sandboxed scripting for entity behavior
- **Physics Abstraction** - Collision events and physics integration
- **Event-Driven Architecture** - Component observers and event bus
- **Rendering Abstraction** - Renderer-agnostic rendering pipeline

## Key Features

✅ **Renderer Agnostic** - Works with Three.js, Babylon.js, or custom renderers  
✅ **Physics Agnostic** - Supports Rapier, Cannon.js, or custom physics engines  
✅ **Type-Safe Scripting** - Lua scripts with TypeScript-like type definitions  
✅ **Hot Reload** - Scripts can be modified without engine restart  
✅ **Extensible** - Custom components, systems, and bridges  
✅ **Testable** - Result monad pattern, dependency injection, mock implementations

## Documentation

### 📚 Core Documentation

- **[Architecture Overview](./docs/ARCHITECTURE.md)** - System design, philosophy, and package structure
- **[ECS System](./docs/ECS.md)** - Entities, components, transforms, and composition
- **[Lua Scripting System](./docs/SCRIPTING.md)** - Sandbox architecture and script lifecycle
- **[Scripting Guide](./docs/SCRIPTING_GUIDE.md)** - Practical examples and API reference
- **[System Flows](./docs/FLOWS.md)** - Diagrams and visual flows

### 🎯 Quick Links

- [Getting Started with ECS](./docs/ECS.md#entity-class)
- [Writing Your First Script](./docs/SCRIPTING_GUIDE.md#your-first-script)
- [Built-in Components](./docs/ECS.md#built-in-components)
- [Lua API Reference](./docs/SCRIPTING_GUIDE.md#complete-api-reference)
- [Performance Best Practices](./docs/SCRIPTING.md#best-practices)

## Installation

```bash
npm install @duckengine/core
```

## Quick Start

### Creating an Entity

```typescript
import { Entity, DefaultEcsComponentFactory } from '@duckengine/core';

const factory = new DefaultEcsComponentFactory();

// Create entity
const player = new Entity("player");
player.transform.setPosition(0, 1, 0);

// Add components
const mesh = factory.create("mesh", { geometry: "box" });
const rigidBody = factory.create("rigidbody", { mass: 1.0 });

player.addComponent(mesh);
player.addComponent(rigidBody);
```

### Writing a Lua Script

```lua
local schema = {
  properties = {
    speed = { type = "number", default = 5.0 }
  }
}

function init()
  log.info("Player", "Initialized!")
end

function update(dt)
  if Input.isKeyPressed('w') then
    local pos = Transform.getPosition(self.entity)
    pos.z = pos.z - self.speed * (dt / 1000)
    Transform.setPosition(self.entity, pos)
  end
end

return schema
```

### Setting Up a Scene

```typescript
import { BaseScene } from '@duckengine/core';

class MyScene extends BaseScene {
  readonly id = "my_scene";
  
  async onEnter() {
    // Create entities
    const player = new Entity("player");
    this.addEntity(player);
    
    // Setup scripts
    await this.scriptSystem.setupAsync(this.entities, this);
  }
  
  update(dt: number) {
    super.update(dt);
    // Custom scene logic
  }
}
```

## Architecture Principles

### Separation of Concerns

```
Domain Layer    → Core business logic (ECS, scripting, physics abstracts)
Application Layer → Services (TextureResolver, LoadingTracker)
Infrastructure  → Concrete implementations (BaseScene, asset loaders)
```

### Dependency Inversion

Core defines **ports** (interfaces), implementations live in separate packages:

```typescript
// Core defines the contract
export interface IRenderingEngine { /* ... */ }

// rendering-three implements it
import { IRenderingEngine } from '@duckengine/core';
export class ThreeRenderingEngine implements IRenderingEngine { /* ... */ }
```

### Composition Over Inheritance

Entities are **composed** of components, not subclassed:

```typescript
// ✅ Good - Composition
const enemy = new Entity("enemy");
enemy.addComponent(meshComponent);
enemy.addComponent(aiComponent);

// ❌ Avoid - Inheritance
class Enemy extends Entity { /* ... */ }
```

## Testing

```bash
npm test
```

The core package includes comprehensive tests:
- **Unit tests** - Component logic, entity hierarchy, scripting APIs
- **Integration tests** - Full ECS + scripting workflows
- **Test utilities** - `SceneTestScaffold` for scene testing

## Contributing

See the main repository for contribution guidelines.

## License

See the main repository for license information.

---

**Need Help?**
- 📖 Read the [Architecture Overview](./docs/ARCHITECTURE.md)
- 🎮 Check the [Scripting Guide](./docs/SCRIPTING_GUIDE.md)
- 🔍 Browse the [API Reference](./docs/SCRIPTING_GUIDE.md#complete-api-reference)
- 📊 Understand the [System Flows](./docs/FLOWS.md)
