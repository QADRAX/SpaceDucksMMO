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

`npm test`
