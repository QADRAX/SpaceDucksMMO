# Duck Engine ECS System

## Overview

The Entity-Component-System (ECS) architecture is the foundational pattern of Duck Engine. It provides a **data-oriented** approach to game object composition, favoring **composition over inheritance**.

## Core Concepts

### Entity

An **Entity** is a unique identifier with:
- A **Transform** (position, rotation, scale)
- A collection of **Components** (data + behavior)
- A position in the **scene graph** (parent-child hierarchy)

Entities are lightweight containers - all behavior comes from components attached to them.

### Component

A **Component** is a reusable piece of data and optional logic attached to an entity. Examples:
- `MeshComponent` - Visual geometry and material
- `CameraViewComponent` - Camera projection settings
- `RigidBodyComponent` - Physics properties
- `ScriptComponent` - Lua scripting behavior

Components are **observable** - they notify listeners when they change, enabling reactive systems.

### System

A **System** operates on entities with specific components. Examples:
- `ScriptSystem` - Executes Lua scripts for entities with `ScriptComponent`
- `RenderSyncSystem` - Updates render objects when visual components change
- `PhysicsSystem` - Simulates physics for entities with `RigidBodyComponent`

Systems are **external** to entities and components, keeping logic decoupled.

## Entity Class

### Core Properties

```typescript
class Entity {
  readonly id: string;              // Unique identifier
  readonly transform: Transform;    // Local & world transform
  
  private _displayName: string;     // Human-readable name
  private _gizmoIcon?: string;      // Debug icon (emoji)
  private components: Map<ComponentType, Component>;
  private _parent?: Entity;
  private children: Entity[];
}
```

### Scene Graph Hierarchy

Entities form a **tree structure** (parent-child relationships):

```typescript
// Add child to entity
parent.addChild(child);

// Remove child
parent.removeChild(childId);

// Get all children
const children = parent.getChildren();

// Get parent
const parent = entity.parent;
```

When a child is added:
- Its transform becomes **relative** to the parent
- Moving the parent moves all children
- World-space transforms are cached for performance

### Component Management

#### Adding Components

```typescript
// Type-safe component creation
const mesh = componentFactory.create("mesh", {
  geometry: "box",
  material: "default"
});

// Add to entity
entity.addComponent(mesh);

// Chaining
entity
  .addComponent(meshComponent)
  .addComponent(rigidBodyComponent);
```

**Validation Rules**:
- **Unique components** cannot be added twice (e.g., `CameraViewComponent`)
- **Required components** must exist before adding dependents (e.g., `MeshComponent` requires geometry)
- **Conflicting components** cannot coexist (e.g., `DirectionalLightComponent` vs `PointLightComponent`)

#### Safe Component Operations

For error handling without exceptions, use `safe*` methods:

```typescript
const result = entity.safeAddComponent(component);

if (result.ok) {
  // Success
} else {
  // result.error contains structured error info
  console.error(result.error.message);
  console.error(result.error.context); // Additional data
}
```

#### Removing Components

```typescript
entity.removeComponent("mesh");

// Safe variant
const result = entity.safeRemoveComponent("mesh");
```

**Removal Validation**:
- Cannot remove a component if another component requires it
- Example: Cannot remove geometry if `MeshComponent` is present

#### Querying Components

```typescript
// Get a specific component (type-safe)
const mesh = entity.getComponent<MeshComponent>("mesh");

// Check if component exists
if (entity.hasComponent("camera_view")) {
  // Camera logic
}

// Get all components
const allComponents = entity.getAllComponents();
```

### Display Properties

Entities have presentation metadata for editors and debug tools:

```typescript
// Set display name
entity.displayName = "Player Character";

// Set gizmo icon (emoji)
entity.gizmoIcon = "🦆";

// Listen to presentation changes
entity.addPresentationListener(() => {
  console.log("Display properties changed");
});
```

### Debug Visualization

Entities support multiple debug visualizations:

```typescript
// Enable transform gizmo
entity.setDebugEnabled('transform', true);

// Enable collider wireframe
entity.setDebugEnabled('collider', true);

// Enable mesh bounds
entity.setDebugEnabled('mesh', true);

// Enable camera frustum
entity.setDebugEnabled('camera', true);

// Check if debug is enabled
const isEnabled = entity.isDebugEnabled('transform');

// Get all enabled debug kinds
const debugs = entity.getEnabledDebugs(); // ['transform', 'collider']

// Listen to debug changes
entity.addDebugListener((kind, enabled) => {
  console.log(`Debug ${kind}: ${enabled}`);
});
```

The debug system is **extensible** - new debug kinds can be added without modifying the `Entity` class.

### Component Events

Entities emit events when components are added/removed:

```typescript
entity.addComponentListener((event) => {
  console.log(event.action); // 'added' | 'removed'
  console.log(event.component.type);
  console.log(event.entity.id);
});
```

**Use Cases**:
- Systems reacting to component changes (e.g., RenderSyncSystem)
- Editor UI updates
- Snapshot/serialization tracking

### Update Loop

Entities have an optional `update(dt)` method that:
- Calls `update(dt)` on all enabled components
- Recursively updates all children

```typescript
entity.update(deltaTime);
```

**Note**: Most entity updates are driven by **external systems** (e.g., `ScriptSystem`, `PhysicsSystem`), not the entity's own `update()` method.

## Component Base Class

### Component Structure

```typescript
abstract class Component {
  abstract readonly type: ComponentType;
  abstract readonly metadata: ComponentMetadata;
  
  protected entityId?: string;
  protected observers: IComponentObserver[] = [];
  private _enabled = true;
  
  get enabled(): boolean;
  set enabled(value: boolean);
  
  update(dt: number): void;
  validate?(entity: Entity): string[];
}
```

### Component Metadata

Metadata defines component behavior and editor presentation:

```typescript
interface ComponentMetadata {
  type: ComponentType;
  label: string;              // Display name
  description: string;        // Tooltip/help text
  category: string;           // Grouping (e.g., "Rendering", "Physics")
  icon: string;               // Lucide icon name
  unique: boolean;            // Only one instance per entity
  requires: ComponentType[];  // Dependencies
  conflicts: ComponentType[]; // Incompatible components
  inspector: {
    fields: FieldDescriptor[]; // Editor fields
  };
}
```

**Example**:

```typescript
readonly metadata: ComponentMetadata = {
  type: "mesh",
  label: "Mesh Renderer",
  description: "Renders a 3D mesh with a material",
  category: "Rendering",
  icon: "Box",
  unique: true,
  requires: ["geometry"],
  conflicts: [],
  inspector: {
    fields: [
      { key: "castShadow", label: "Cast Shadow", type: "boolean" },
      { key: "receiveShadow", label: "Receive Shadow", type: "boolean" }
    ]
  }
};
```

### Observable Pattern

Components notify observers when they change:

```typescript
class MyComponent extends Component {
  private _value = 0;
  
  set value(v: number) {
    this._value = v;
    this.notifyChanged(); // Alerts all observers
  }
}
```

**Observers** (e.g., `RenderSyncSystem`) react to changes:

```typescript
class RenderSyncSystem implements IComponentObserver {
  onComponentChanged(entityId: string, componentType: ComponentType) {
    // Update render object
  }
  
  onComponentRemoved(entityId: string, componentType: ComponentType) {
    // Clean up render object
  }
}
```

### Component Lifecycle

1. **Creation**: `componentFactory.create(type, params)`
2. **Attachment**: `entity.addComponent(component)`
   - Validation runs (`validate()` method)
   - `component.setEntityId(entityId)` is called
   - Observers are notified
3. **Updates**: `component.update(dt)` (optional)
4. **Removal**: `entity.removeComponent(type)`
   - Removal validation runs
   - `component.notifyRemoved()` alerts observers
   - Component is detached

### Example: Custom Component

```typescript
import { Component, ComponentMetadata } from '@duckengine/core';

export class HealthComponent extends Component {
  readonly type = "health";
  readonly metadata: ComponentMetadata = {
    type: "health",
    label: "Health",
    description: "Entity health and damage tracking",
    category: "Gameplay",
    icon: "Heart",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        { 
          key: "max", 
          label: "Max Health", 
          type: "number", 
          defaultValue: 100 
        },
        { 
          key: "current", 
          label: "Current Health", 
          type: "number", 
          defaultValue: 100 
        }
      ]
    }
  };
  
  max = 100;
  private _current = 100;
  
  get current() {
    return this._current;
  }
  
  set current(v: number) {
    this._current = Math.max(0, Math.min(v, this.max));
    this.notifyChanged();
    
    if (this._current === 0) {
      // Custom logic: entity died
      console.log(`Entity ${this.entityId} died`);
    }
  }
  
  takeDamage(amount: number) {
    this.current -= amount;
  }
  
  heal(amount: number) {
    this.current += amount;
  }
}
```

## Transform System

### Transform Class

The `Transform` class handles position, rotation, and scale in **local** and **world** space:

```typescript
class Transform {
  // Local space (relative to parent)
  localPosition: Vec3;
  localRotation: Euler;
  localScale: Vec3;
  
  // World space (absolute)
  readonly worldPosition: Vec3;
  readonly worldRotation: Euler;
  readonly worldScale: Vec3;
  
  // Hierarchy
  parent?: Transform;
  children: Transform[];
}
```

### Setting Transforms

```typescript
// Set local position
transform.setPosition(x, y, z);
transform.setPosition(vec3);

// Set local rotation (Euler angles in degrees)
transform.setRotation(x, y, z);
transform.setRotation(euler);

// Set local scale
transform.setScale(x, y, z);
transform.setScale(vec3);

// Look at a point
transform.lookAt(targetPosition);
```

### Querying Transforms

```typescript
// Get local transforms
const pos = transform.localPosition;
const rot = transform.localRotation;
const scale = transform.localScale;

// Get world transforms (computed)
const worldPos = transform.worldPosition;
const worldRot = transform.worldRotation;

// Get direction vectors
const forward = transform.getForward(); // -Z axis
const right = transform.getRight();     // +X axis
const up = transform.getUp();           // +Y axis
```

### Transform Hierarchy

Transforms are linked in a parent-child hierarchy:

```typescript
// Set parent
childTransform.setParent(parentTransform);

// Remove parent
childTransform.setParent(undefined);

// Query
const parent = transform.parent;
const children = transform.children;
```

**World Transform Calculation**:
- When a transform changes, world transforms are recalculated
- Child transforms inherit parent's world transform
- Caching minimizes redundant calculations

### Transform Listeners

Transforms notify listeners when they change:

```typescript
transform.addListener(() => {
  console.log("Transform changed");
});
```

## Component Factory

The `ComponentFactory` creates components from type strings:

```typescript
interface IEcsComponentFactory {
  create(type: ComponentType, params?: any): Component;
}
```

**Default Implementation**:

```typescript
const factory = new DefaultEcsComponentFactory();

// Create mesh component
const mesh = factory.create("mesh", {
  geometry: "box",
  material: "default",
  castShadow: true
});

// Create camera
const camera = factory.create("camera_view", {
  fov: 75,
  near: 0.1,
  far: 1000
});
```

**Extensibility**:

Custom factories can extend the default to support new component types:

```typescript
class MyComponentFactory extends DefaultEcsComponentFactory {
  create(type: ComponentType, params?: any): Component {
    if (type === "health") {
      return new HealthComponent(params);
    }
    return super.create(type, params);
  }
}
```

## Built-in Components

### Rendering

- **`MeshComponent`** - 3D mesh with material
- **`CameraViewComponent`** - Camera projection (perspective/orthographic)
- **`DirectionalLightComponent`** - Sun-like directional light
- **`PointLightComponent`** - Omnidirectional point light
- **`SpotLightComponent`** - Cone-shaped spot light
- **`EnvironmentComponent`** - Skybox, fog, ambient light
- **`PostProcessComponent`** - Post-processing effects

### Geometry

- **`BoxGeometryComponent`** - Box primitive
- **`SphereGeometryComponent`** - Sphere primitive
- **`PlaneGeometryComponent`** - Plane primitive
- **`CylinderGeometryComponent`** - Cylinder primitive
- **`ModelGeometryComponent`** - 3D model (GLTF, OBJ, etc.)

### Physics

- **`RigidBodyComponent`** - Physics body (dynamic, kinematic, static)
- **`ColliderComponent`** - Collision shape (box, sphere, capsule, mesh)

### Behavior

- **`ScriptComponent`** - Lua scripting
- **`FirstPersonMoveComponent`** - Keyboard movement
- **`MouseLookComponent`** - Mouse camera control
- **`OrbitComponent`** - Orbit around a point
- **`LookAtPointComponent`** - Look at a target
- **`LookAtEntityComponent`** - Look at another entity

### Utility

- **`NameComponent`** - Entity name/metadata
- **`LensFlareComponent`** - Lens flare effect

See [COMPONENTS.md](./COMPONENTS.md) for full reference.

## ECS World Context

The `EcsWorldContext` provides global access to core services:

```typescript
interface EcsWorldContext {
  inputState: InputContext;        // Keyboard, mouse, gamepad
  physicsRaycast?: (ray: EcsPhysicsRay) => RaycastResult;
  physicsOverlapSphere?: (params: OverlapSphereParams) => Entity[];
}
```

**Usage**:

```typescript
// Set global context (done by BaseScene)
setCurrentEcsWorld(context);

// Access in components/systems
import { getCurrentEcsWorld } from '@duckengine/core';

const world = getCurrentEcsWorld();
if (world.inputState.isKeyPressed('w')) {
  // Move forward
}
```

## Best Practices

### 1. Favor Composition Over Inheritance

Instead of:
```typescript
class Player extends Entity { /* custom logic */ }
```

Do:
```typescript
const player = new Entity("player");
player.addComponent(meshComponent);
player.addComponent(rigidBodyComponent);
player.addComponent(playerControllerComponent);
```

### 2. Keep Components Data-Focused

Components should primarily hold **data**, not complex logic:

```typescript
// Good: Data-focused component
class HealthComponent extends Component {
  max = 100;
  current = 100;
}

// Avoid: Logic-heavy component
class HealthComponent extends Component {
  update(dt: number) {
    // Complex game logic
  }
}
```

Put complex logic in **systems** or **scripts**, not components.

### 3. Use Observers for Reactivity

When data changes, notify observers instead of polling:

```typescript
// Good: Reactive
set health(v: number) {
  this._health = v;
  this.notifyChanged(); // Observers react
}

// Avoid: Polling
update(dt: number) {
  if (this.needsUpdate) {
    // Check every frame
  }
}
```

### 4. Validate Component Constraints

Use metadata to enforce constraints:

```typescript
readonly metadata: ComponentMetadata = {
  // ...
  unique: true,              // Only one per entity
  requires: ["geometry"],    // Needs geometry first
  conflicts: ["other_type"]  // Cannot coexist
};
```

### 5. Use Safe Operations for Error Handling

Prefer `safe*` methods when handling user input or dynamic operations:

```typescript
const result = entity.safeAddComponent(component);
if (!result.ok) {
  // Show error to user
  return result.error.message;
}
```

## Testing ECS Components

### Unit Testing Components

```typescript
import { Entity, DefaultEcsComponentFactory } from '@duckengine/core';

test('HealthComponent reduces on damage', () => {
  const entity = new Entity('test');
  const health = new HealthComponent();
  entity.addComponent(health);
  
  health.takeDamage(30);
  
  expect(health.current).toBe(70);
});
```

### Testing Component Observers

```typescript
test('MeshComponent notifies observers on change', () => {
  const mesh = new MeshComponent();
  const mockObserver = {
    onComponentChanged: jest.fn(),
    onComponentRemoved: jest.fn()
  };
  
  mesh.addObserver(mockObserver);
  mesh.setEntityId('test');
  
  mesh.castShadow = true; // Should trigger notification
  
  expect(mockObserver.onComponentChanged).toHaveBeenCalledWith(
    'test',
    'mesh'
  );
});
```

### Testing Entity Hierarchy

```typescript
test('Child transform inherits parent transform', () => {
  const parent = new Entity('parent');
  const child = new Entity('child');
  
  parent.addChild(child);
  parent.transform.setPosition(10, 0, 0);
  child.transform.setPosition(5, 0, 0);
  
  // Child world position = parent world + child local
  expect(child.transform.worldPosition.x).toBe(15);
});
```

## Next Steps

- [Lua Scripting System & Sandbox](./SCRIPTING.md)
- [Scripting Guide & API Reference](./SCRIPTING_GUIDE.md)
- [Component Reference](./COMPONENTS.md)
