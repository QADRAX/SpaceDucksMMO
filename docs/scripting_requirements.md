# Lua Scripting System — Requirements Specification

> This document defines the **requirements** for the Lua scripting integration into the DuckEngine.
> It serves as the permanent reference for what the system must do, derived from the
> [Lua Scripting Analysis](./lua_scripting_analysis.md).

---

## 1. System Overview

The scripting system allows users to attach Lua scripts to entities in the scene editor.
Scripts define behavior through lifecycle hooks and communicate via a scene-scoped event bus.
The engine ships with built-in scripts that replace the current hardcoded logic components.

### 1.1 Goals

- **Composability** — Multiple scripts per entity via a slot-based `ScriptComponent`.
- **Safety** — Lua runs in a Wasmoon sandbox with instruction limits and restricted API.
- **Simplicity** — Scripts are pure functions (`init`, `update`, etc.) with a minimal bridge API.
- **Editor integration** — Scripts are versioned resources; not hot-reloaded live.
- **Extensibility** — The editor's own camera becomes a Lua script, opening the door to user-customizable editor tools.

### 1.2 Non-Goals (out of scope for v1)

- Server-side scripting
- Hot-reload while a scene is playing
- Visual scripting / node graphs
- Plugin/mod system for custom `ComponentType` registration

---

## 2. ScriptComponent Design

### REQ-SC-01: Slot-Based Architecture
The `ScriptComponent` is a single ECS component (type `"script"`) that internally holds an ordered array of `ScriptSlot[]`. The Entity's `Map<ComponentType, Component>` is unchanged.

### REQ-SC-02: ScriptSlot Structure
Each slot contains:

| Field | Type | Description |
|-------|------|-------------|
| `slotId` | `string` | Unique ID within the component (UUID) |
| `scriptId` | `string` | Reference to a `ScriptResource` by resource ID |
| `enabled` | `boolean` | Can be toggled per-slot from the Inspector |
| `properties` | `Record<string, unknown>` | Key-value overrides passed as `props` to hooks |
| `executionOrder` | `number` | Determines ordering within the entity (lower = first) |

### REQ-SC-03: ComponentType Extension
Add `| "script"` and `| "metadata"` to the `ComponentType` union in `ComponentType.ts`.

### REQ-SC-04: ComponentFactory Extension
Add a `"script"` case to `DefaultEcsComponentFactory.create()`. In `listCreatableComponents()`, always include `"script"` regardless of existing components.

### REQ-SC-05: Unique Component
The `ScriptComponent` metadata must set `unique: true` — only one instance per entity. Adding multiple scripts is done by adding **slots** within the component via the Inspector UI ("Add Script Slot" button), not by adding multiple `ScriptComponent` instances.

### REQ-SC-06: Serialization
The snapshot format for a `ScriptComponent` is a single entry:
```json
{
  "type": "script",
  "data": {
    "scripts": [
      { "slotId": "uuid-1", "scriptId": "res_abc", "enabled": true, "properties": { "speed": 5 }, "executionOrder": 0 },
      { "slotId": "uuid-2", "scriptId": "res_def", "enabled": true, "properties": {}, "executionOrder": 1 }
    ]
  }
}
```
No changes to the snapshot schema are required.

---

## 3. ScriptSystem Design

### REQ-SYS-01: Phased Execution
The `ScriptSystem` drives all script execution. `ScriptComponent.update(dt)` is a **no-op**. The system provides three phases called by `BaseScene.update()`:

```
earlyUpdate(dt) → [legacy ent.update] → physics → update(dt) → [event flush] → lateUpdate(dt) → renderSync
```

### REQ-SYS-02: Entity Iteration
Each phase iterates all entities with a `ScriptComponent`, then iterates each enabled slot within, calling the corresponding Lua hook if defined.

### REQ-SYS-03: Execution Order
Slots are sorted by `executionOrder` (ascending). Within the same order value, insertion order determines precedence.

### REQ-SYS-04: Hook Caching
When a script is compiled, the `ScriptSystem` inspects the Lua module for defined functions (`init`, `update`, etc.) and caches references. Undefined hooks are skipped with zero overhead per frame.

### REQ-SYS-05: Scene Lifecycle Integration
- On scene **setup** (entering Play mode): compile all scripts, call `init()` on all slots, fire `"SceneReady"` event.
- On scene **teardown** (exiting Play mode): call `onDestroy()` on all slots, release all Lua states, dispose the `SceneEventBus`.

---

## 4. Lifecycle Hooks

### REQ-HOOK-01: Complete Hook Table

| Hook | Signature | When | Required? |
|------|-----------|------|-----------|
| `init` | `init(self, props)` | Once at scene Play start | No |
| `onEnable` | `onEnable(self, props)` | On slot disabled → enabled transition | No |
| `earlyUpdate` | `earlyUpdate(self, props, dt)` | Every frame, before physics | No |
| `update` | `update(self, props, dt)` | Every frame, after physics | No |
| `lateUpdate` | `lateUpdate(self, props, dt)` | Every frame, after event flush | No |
| `onCollisionEnter` | `onCollisionEnter(self, other)` | Collision start (enter) | No |
| `onCollisionExit` | `onCollisionExit(self, other)` | Collision end (exit) | No |
| `onDisable` | `onDisable(self)` | On slot enabled → disabled transition | No |
| `onDestroy` | `onDestroy(self)` | Slot removed or entity destroyed | No |

### REQ-HOOK-02: All Hooks Are Optional
A script may define any subset. The `ScriptSystem` only calls hooks that exist.

### REQ-HOOK-03: `init` Called Once
`init` runs once when the scene enters Play. Disabling and re-enabling a slot triggers `onEnable`, not `init` again.

### REQ-HOOK-04: Collision Hooks Are Conditional
The `ScriptSystem` only subscribes to `CollisionEventsHub` for an entity if:
1. At least one slot defines `onCollisionEnter` or `onCollisionExit`, **AND**
2. The entity has a `collider` or `rigidBody` component.

If neither condition is met, no subscription occurs and the hooks never fire.

### REQ-HOOK-05: `onCollisionStay` Excluded
`onCollisionStay` is intentionally not provided as a hook. Scripts that need continuous collision data should poll via `physics.isColliding()` in `update()`.

---

## 5. Scene Event Bus

### REQ-EVT-01: Scene-Scoped
Events only exist within the active scene. There is no global event bus.

### REQ-EVT-02: Async Delivery
Events fired via `scene.fireEvent(name, data)` are enqueued and delivered during a flush window between `update()` and `lateUpdate()`.

### REQ-EVT-03: No Cascading
If an event handler fires another event during the flush, the new event goes into the **next frame's** queue. No cascading within a single frame.

### REQ-EVT-04: Auto-Cleanup
When a slot is destroyed, all its event subscriptions are automatically removed via `SceneEventBus.unsubscribeAll(slotId)`.

### REQ-EVT-05: API

```lua
-- Subscribe
scene.onEvent("EventName", function(data) ... end)

-- Fire
scene.fireEvent("EventName", { key = value })
```

### REQ-EVT-06: Reserved Events

| Event | Data | Fired by |
|-------|------|----------|
| `"SceneReady"` | `{}` | ScriptSystem, after all `init()` complete |
| `"EntityAdded"` | `{ entityId }` | ScriptSystem, from `SceneChangeEvent` |
| `"EntityRemoved"` | `{ entityId }` | ScriptSystem, from `SceneChangeEvent` |

---

## 6. Lua Sandbox

### REQ-LUA-01: Runtime
Use [Wasmoon](https://github.com/nickmessing/wasmoon) (Lua 5.4 compiled to WASM via Emscripten).

### REQ-LUA-02: Instruction Limit
Each hook invocation is capped at **100,000 Lua instructions**. Exceeding the limit terminates the hook and logs a warning.

### REQ-LUA-03: Sandbox Restrictions
The Lua environment must NOT expose:
- `os`, `io`, `loadfile`, `dofile` (filesystem access)
- `debug` library (introspection escape)
- `rawset`/`rawget` on bridge objects (metatable bypass)

### REQ-LUA-04: `self` Object
Each hook receives a `self` table with:

| Field | Type | Description |
|-------|------|-------------|
| `self.id` | `string` | The entity ID |
| `self.slotId` | `string` | The slot ID within the ScriptComponent |
| `self.state` | `table` | Per-slot persistent state (survives across frames) |
| `self:getComponent(type)` | `function` | Returns a proxy to read/write component data |

### REQ-LUA-05: Error Isolation
A Lua error in one hook must not crash the engine or affect other scripts. Errors are caught with `pcall`, logged, and the slot is optionally disabled after N consecutive errors.

---

## 7. Bridge API (Lua → TypeScript)

### REQ-BRIDGE-01: Transform Access

```lua
transform.getPosition(entityId)      --> { x, y, z }
transform.setPosition(entityId, x, y, z)
transform.getRotation(entityId)      --> { x, y, z, w } (quaternion)
transform.setRotation(entityId, x, y, z, w)
transform.getScale(entityId)         --> { x, y, z }
transform.setScale(entityId, x, y, z)
transform.getForward(entityId)       --> { x, y, z }
transform.getRight(entityId)         --> { x, y, z }
transform.lookAt(entityId, x, y, z)
```

### REQ-BRIDGE-02: Input Access

```lua
input.isKeyPressed(key)              --> boolean
input.isMouseButtonPressed(button)   --> boolean
input.getMouseDelta()                --> { x, y }
input.getMousePosition()             --> { x, y }
input.isPointerLocked()              --> boolean
```

### REQ-BRIDGE-03: Physics Access

```lua
physics.applyImpulse(entityId, x, y, z)
physics.applyForce(entityId, x, y, z)
physics.getLinearVelocity(entityId)  --> { x, y, z } | nil
physics.raycast(ox, oy, oz, dx, dy, dz, maxDist)  --> { entityId, point, normal, distance } | nil
```

### REQ-BRIDGE-04: Scene Access

```lua
scene.getEntity(entityId)            --> entity proxy | nil
scene.findEntitiesByTag(tag)         --> { entityId, ... }
scene.fireEvent(name, data)
scene.onEvent(name, callback)
```

### REQ-BRIDGE-05: Time Access

```lua
time.dt          --> delta time in seconds
time.elapsed     --> total elapsed time in seconds
time.frame       --> current frame number
```

### REQ-BRIDGE-06: Bridge Wrapping
All bridge functions wrap the global singleton services (`getInputServices()`, `getPhysicsServices()`). They do NOT expose the singletons directly to Lua.

### REQ-BRIDGE-07: Editor Sandbox Restrictions
When scripts run in the Editor context (Section 10 of the analysis), the bridge disables writes to physics (`applyImpulse`, `applyForce`) and restricts scene mutations.

---

## 8. Script Resources

### REQ-RES-01: Resource Type
Scripts are stored as `ResourceType.SCRIPT` in the resource database  with fields:
- `id` (resource ID)
- `name` (display name)
- `content` (Lua source code as string)
- `version` (auto-incremented on save)

### REQ-RES-02: Built-in Scripts
The engine ships with built-in scripts that replicate the behavior of deprecated logic components:

| Built-in Script | Replaces |
|-----------------|----------|
| `first_person_move.lua` | `FirstPersonMoveComponent` |
| `first_person_physics_move.lua` | `FirstPersonPhysicsMoveComponent` |
| `mouse_look.lua` | `MouseLookComponent` |
| `orbit_camera.lua` | `OrbitComponent` |
| `look_at_entity.lua` | `LookAtEntityComponent` |
| `look_at_point.lua` | `LookAtPointComponent` |
| `editor_camera.lua` | Editor's built-in camera control |

### REQ-RES-03: Resource Reference
Script slots reference scripts by resource ID (`scriptId`). The `ScriptSystem` resolves the resource ID to source code at scene Play start.

---

## 9. Legacy Component Deprecation

### REQ-DEP-01: Three-Phase Migration

**Phase 1 — Coexistence:** Both legacy components and scripts work simultaneously. Legacy components are marked `@deprecated`.

**Phase 2 — Auto-Migration:** Scene deserialization detects legacy component types and auto-converts them to `ScriptComponent` slots pointing to the equivalent built-in script with matching properties.

**Phase 3 — Removal:** Legacy component classes, their `ComponentType` values, and factory cases are deleted.

### REQ-DEP-02: Non-Deprecated Components
The following rendering/data components are **NOT deprecated**:
`LensFlareComponent`, `PostProcessComponent`, all geometry components, all material components, all light components, all collider/physics components, `CameraViewComponent`, `TransformComponent`, `NameComponent`.

---

## 10. Editor Integration

### REQ-ED-01: Script Slot Inspector
The Inspector panel for `ScriptComponent` shows a list of slots. Each slot displays:
- Script name (resolved from `scriptId`)
- Enable/disable toggle
- Collapsible properties panel (key-value editor)
- Execution order (drag-to-reorder or numeric input)
- "Remove" button

### REQ-ED-02: Add Script Slot
An "Add Script" button opens a script resource picker. Selecting a script creates a new slot with default properties.

### REQ-ED-03: Script Editor
Scripts are edited in the Resource Browser using Monaco editor with Lua syntax highlighting and EmmyLua type annotations for the bridge API.

### REQ-ED-04: No Live Execution
Scripts do NOT execute in the editor's Edit mode. They only run when the scene enters Play mode. Editor-specific scripts (e.g., editor camera) follow the separate Editor Sandbox rules described in the analysis document.

---

## Requirement Traceability

| Requirement | Analysis Section | ECS Conflict |
|-------------|-----------------|--------------|
| REQ-SC-01 | §7, §11 Conflict 1 | Map<ComponentType, Component> |
| REQ-SC-03, REQ-SC-04 | §11 Impl. Task | ComponentType + Factory |
| REQ-SYS-01 | §7.3, §11 Conflict 3 | Game loop phases |
| REQ-HOOK-04 | §12 Open Q #2 | CollisionEventsHub guard |
| REQ-EVT-01..06 | §12 Open Q #3 | SceneEventBus design |
| REQ-LUA-01..05 | §2, §3, §4, §5 | Wasmoon sandbox |
| REQ-BRIDGE-01..07 | §4, §11 Conflict 4 | Global singletons |
| REQ-DEP-01..02 | §11 Conflict 2 | Legacy deprecation |
