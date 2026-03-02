# @duckengine/physics-rapier

Rapier-backed physics integration for DuckEngine.

## Overview

The public entrypoint is `RapierPhysicsSystem` (see [src/RapierPhysicsSystem.ts](src/RapierPhysicsSystem.ts)).

Internally it is split into small, single-purpose modules:

- [src/internal/RapierBodies.ts](src/internal/RapierBodies.ts)
  - RigidBody creation/removal
  - Kinematic sync (ECS → Rapier)
  - Dynamic writeback (Rapier → ECS)
- [src/internal/RapierColliders.ts](src/internal/RapierColliders.ts)
  - Collider creation/removal
  - Compound colliders (child colliders attach to nearest rigidBody ancestor)
  - Standalone colliders (collider without rigidBody gets an internal fixed host body)
- [src/internal/RapierCollisionEvents.ts](src/internal/RapierCollisionEvents.ts)
  - Rapier `EventQueue` draining
  - enter/stay/exit event stream

This separation keeps the public API stable while making the implementation easier to test and evolve.

## Coordinate system & rotations

- Axes are right-handed and match Three.js default world axes.
- ECS `Transform` uses Euler rotations in **YXZ** order.
  - Rendering uses this explicitly: `object3D.rotation.order = 'YXZ'`.
- Rapier uses quaternions.
  - Conversion is centralized in `@duckengine/ecs` Math3D helpers.

## Compound colliders

If an entity has a collider but no rigidBody, the collider attaches to the nearest ancestor entity with a rigidBody.
That means you can build compound shapes by parenting collider entities under a rigidBody root.

Local collider pose relative to the rigidBody is computed from world transforms (position + rotation). This makes
compound colliders behave correctly under rotated parent chains.

## Terrain heightfield semantics

`TerrainColliderComponent.heightfield.size` is interpreted as the **total** world size of the terrain grid, centered
at the entity origin.

Rapier heightfields are corner-origin and use per-cell scaling, so the integration:

- computes scale per cell: `size / (samples - 1)`
- applies a local translation shift to center the heightfield at `(0,0,0)`

## Running tests

From this package:

- `npm test` - run all tests (unit + integration)
- `npm run test:unit` - run only unit tests
- `npm run test:integration` - run only integration tests

## Integration Test Framework

### Scaffold Architecture

The test scaffold (`RapierSceneTestScaffold`) provides a complete physics testing environment:

- **Full Scene Lifecycle**: Mounts `BaseScene` with real `RapierPhysicsSystem` (no rendering)
- **Script Support**: Optional Lua script integration via `ScriptSystem` (injection-based)
- **Collision Hub**: Access to `CollisionEventsHub` for collision assertions
- **Custom Scripts**: Inyectable test scripts via `scriptOverrides`

### Test Script System

Test scripts live in `src/__tests__/scripts/` and are bundled at build time:

```bash
# Auto-generates src/__tests__/generated/PhysicsTestScriptAssets.ts
npm run build:test-scripts

# Included in build
npm run build
```

Available test scripts:
- `test://collision_logger.lua` - Tracks collision events for test validation
- `test://apply_force.lua` - Applies forces/impulses to rigid bodies (example)

### Test Coverage

Tests in `src/__tests__/integration/` cover:

1. **Collision Detection**: Sphere-Box, Cylinder-Cone, and mixed collider types
2. **Rigid Body Properties**: Dynamic/kinematic bodies, mass, gravity, friction, restitution
3. **Compound Colliders**: Multi-collider entities, local pose transforms, parent hierarchy
4. **Script Integration**: Custom Lua scripts with injection patterns

Example:

```typescript
const scaffold = await RapierSceneTestScaffold.create({
  timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  scriptOverrides: {
    "test://collision_logger.lua": PhysicsTestScripts["test://collision_logger.lua"],
  },
});

const entity = scaffold.spawnScriptedEntity("test", "test://collision_logger.lua");
scaffold.runFrames(100, 17);
scaffold.dispose();
```

### Extending Tests

#### Add a New Test Script

1. Create `.lua` file in `src/__tests__/scripts/`:

```lua
-- src/__tests__/scripts/my_test_behavior.lua
---@type ScriptBlueprint
return {
    schema = { name = "My Test", properties = {} },
    init = function(self)
        self.state = { executed = false }
    end,
    update = function(self, dt)
        self.state.executed = true
    end
}
```

2. Regenerate assets:

```bash
npm run build:test-scripts
```

3. Use in tests:

```typescript
import { PhysicsTestScripts } from "../generated/PhysicsTestScriptAssets";

const scaffold = await RapierSceneTestScaffold.create({
  scriptOverrides: {
    "test://my_test_behavior.lua": PhysicsTestScripts["test://my_test_behavior.lua"],
  },
});
```

#### Add a New Integration Test

Create a test file in `src/__tests__/integration/`:

```typescript
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("My Physics Feature", () => {
  it("validates expected behavior", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
    });

    try {
      // Create entities with physics components
      const entity = new Entity("test");
      entity.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      entity.addComponent(new SphereColliderComponent({ radius: 1 }));
      
      scaffold.addEntity(entity);
      scaffold.runFrames(60, 17);
      
      expect(entity.transform.worldPosition.y).toBeLessThan(5);
    } finally {
      scaffold.dispose();
    }
  });
});
