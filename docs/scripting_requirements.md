# Lua Scripting System — Requirements Specification

> This document defines the **requirements** for the Lua scripting integration into the DuckEngine.
> It serves as the permanent reference for what the system must do.

---

## 1. System Overview

The scripting system allows users to attach Lua scripts to entities in the scene editor.
Scripts define behavior through lifecycle hooks, declare their dependencies via a typed schema,
and communicate via a scene-scoped event bus.

### 1.1 Goals

- **Composability** — Multiple scripts per entity via a slot-based `ScriptComponent`.
- **Safety** — Lua runs in a Wasmoon sandbox with instruction limits, restricted API, and schema-driven guards.
- **Declarative** — Scripts declare entity, resource, and prefab dependencies in `schema`; the engine provides and validates them.
- **No Global State** — Game scripts operate only on `self` and explicitly declared references. No direct scene queries.
- **Typed Resources** — Resource references in schemas are strongly typed (`material`, `mesh`, `prefab`, etc.), not generic.
- **Prefab-Based Spawning** — New entities are created exclusively via prefab instantiation, not ad-hoc construction.
- **Editor Extensibility** — A separate editor scripting context allows user-customizable editor tools.
- **Zero-Hitch Runtime** — Prefabs and resources are pre-loaded at scene setup; no async loads during gameplay.

### 1.2 Non-Goals (out of scope for v1)

- Server-side scripting
- Hot-reload while a scene is playing
- Visual scripting / node graphs
- Plugin/mod system for custom `ComponentType` registration

---

## 2. ScriptComponent Design

### REQ-SC-01: Slot-Based Architecture
The `ScriptComponent` is a single ECS component (type `"script"`) that internally holds an ordered array of `ScriptSlot[]`.

### REQ-SC-02: ScriptSlot Structure

| Field | Type | Description |
|-------|------|-------------|
| `slotId` | `string` | Unique ID within the component (UUID) |
| `scriptId` | `string` | Reference to a `ScriptResource` by resource ID |
| `enabled` | `boolean` | Can be toggled per-slot from the Inspector |
| `properties` | `Record<string, unknown>` | Key-value overrides passed to `self.properties` |
| `executionOrder` | `number` | Determines ordering within the entity (lower = first) |

### REQ-SC-03: ComponentType Extension
Add `| "script"` and `| "metadata"` to the `ComponentType` union.

### REQ-SC-04: ComponentFactory Extension
Add a `"script"` case to `DefaultEcsComponentFactory.create()`.

### REQ-SC-05: Unique Component
The `ScriptComponent` metadata must set `unique: true`.

### REQ-SC-06: Serialization
Snapshot format for a `ScriptComponent`:
```json
{
  "type": "script",
  "data": {
    "scripts": [
      { "slotId": "uuid-1", "scriptId": "res_abc", "enabled": true, "properties": { "speed": 5 }, "executionOrder": 0 }
    ]
  }
}
```

---

## 3. Script Schema & Declarative Dependencies

### REQ-SCHEMA-01: Schema Definition
Every script must return a table with an optional `schema` field that declares metadata, required dependencies, and typed properties:

```lua
return {
    schema = {
        name = "My Script",
        description = "Does something useful.",
        requires = { "target" },
        properties = {
            target = { type = "entity", description = "The entity to affect." },
            speed = { type = "number", default = 5 },
        }
    },
    update = function(self, dt) ... end
}
```

### REQ-SCHEMA-02: Required Reference Guards
If `schema.requires` lists property names, the engine verifies that each listed property is non-nil and, for entity references, that the entity still exists in the scene. If any required ref is invalid:
- `update`, `earlyUpdate`, `lateUpdate` are **skipped** for that frame.
- The script is not disabled — it resumes automatically when refs become valid again.

### REQ-SCHEMA-03: Managed Entity References
Properties with `type = "entity"` are automatically hydrated onto `self` as `LuaEntity` objects. The engine handles hydration during `init` and updates references when properties change via `onPropertyChanged`.

### REQ-SCHEMA-04: No Global Scene Access
Game scripts (entity-scoped) do NOT have access to:
- `scene.getEntity(id)`
- `scene.findEntityByName(name)`
- `scene.exists(id)`

All entity references must come through schema-declared properties.

### REQ-SCHEMA-05: Retained Scene APIs
Game scripts retain access to the event bus:
- `scene.fireEvent(name, data)` — fire a scene-scoped event.
- `scene.onEvent(self, name, callback)` — subscribe to events.

---

## 4. Typed Resource References

### REQ-RES-01: Strongly Typed Schema Properties
Resource references in script schemas are typed to match the engine's `ResourceKind` taxonomy:

| Schema type | ResourceKind(s) | Lua value |
|---|---|---|
| `entity` | — | `LuaEntity` (managed, auto-hydrated) |
| `material` | `basicMaterial`, `lambertMaterial`, `phongMaterial`, `standardMaterial` | Pre-resolved material data |
| `mesh` | `customMesh`, `fullMesh` | Pre-loaded geometry/GLB reference |
| `skybox` | `skybox` | Pre-loaded cubemap reference |
| `prefab` | `prefab` | `LuaPrefab` with `:instantiate()` method |
| `number` | — | `number` |
| `string` | — | `string` |
| `vec3` | — | `{ x, y, z }` table |

### REQ-RES-02: Scene Resource Pool
Resources referenced by scripts must be declared in the scene definition and pre-loaded during `setup()`:
- All textures, materials, meshes, and GLBs are resolved and uploaded to GPU before gameplay starts.
- Scripts cannot trigger async asset loads at runtime.
- Resource lookup at runtime is an instant keyed access with zero latency.

### REQ-RES-03: Resource Application
Scripts apply resources to entities via typed methods:
```lua
entity:applyMaterial(self.damageMat)
entity:applyMesh(self.weaponModel)
```
These methods validate that the resource kind matches the target component type.

---

## 5. Prefab System

### REQ-PREFAB-01: Prefab Definition
A Prefab is an entity tree stored as an `EcsTreeSnapshot` resource (kind `"prefab"`) in the resource database. Prefabs are scene-resident templates that are loaded and validated at scene setup but not rendered.

### REQ-PREFAB-02: Prefab Instantiation
Scripts instantiate prefabs via the `:instantiate()` method on prefab references:
```lua
local bullet = self.bulletPrefab:instantiate({
    position = { x, y, z }
})
```
`instantiate()` performs:
1. Deep-clone of the entity tree with fresh UUIDs.
2. Application of transform overrides to the root entity.
3. Addition of all cloned entities to the active scene.

### REQ-PREFAB-03: Instance Identity
After instantiation, the resulting entity is a **full ECS citizen** — indistinguishable from a hand-placed entity. It has its own components, scripts, physics body, and renders independently.

### REQ-PREFAB-04: GPU Resource Sharing (Warm-on-Load)
During `scene.setup()`, prefab templates are "warmed":
- THREE.js `BufferGeometry`, `Material`, and `Texture` objects are created once for each template.
- On `instantiate()`, new `THREE.Mesh` instances reference the **shared** geometry and material (no GPU re-upload).
- Textures are shared via `TextureCache`.

| Resource | Strategy | Instantiation cost |
|---|---|---|
| `BufferGeometry` | Shared instance | 0ms |
| `Material` | Shared ref (COW on write) | 0ms |
| `Texture` | Shared via TextureCache | 0ms |
| `Mesh` | New instance per clone | <0.5ms |
| GLB Group | Clone hierarchy, share geometry/material | <1ms |

### REQ-PREFAB-05: Copy-on-Write Materials
When a script writes to a material property on a prefab instance that shares its material with other instances:
1. The material is **cloned** for that instance only (JS copy, no shader recompile).
2. The original shared material remains untouched for all other instances.
3. Unmodified textures within the cloned material continue to share GPU resources.

---

## 6. ScriptSystem Design

### REQ-SYS-01: Phased Execution
```
earlyUpdate(dt) → [entity.update] → physics → update(dt) → [event flush] → lateUpdate(dt) → renderSync
```

### REQ-SYS-02: Schema Guard Enforcement
Before calling `earlyUpdate`, `update`, or `lateUpdate` on a slot, the system checks all properties listed in `schema.requires`. If any entity ref is nil or points to a destroyed entity, the hook is skipped for that frame.

### REQ-SYS-03: Entity Iteration
Each phase iterates all entities with a `ScriptComponent`, then iterates each enabled slot, calling the corresponding Lua hook if defined.

### REQ-SYS-04: Execution Order
Slots are sorted by `executionOrder` (ascending).

### REQ-SYS-05: Hook Caching
When a script is compiled, the system inspects the Lua module for defined functions and caches references. Undefined hooks are skipped with zero overhead.

### REQ-SYS-06: Scene Lifecycle Integration
- **Setup**: Compile all scripts, hydrate managed refs, call `init()`, fire `"SceneReady"`.
- **Teardown**: Call `onDestroy()` on all slots, release Lua states, dispose event bus.

### REQ-SYS-07: Property Change Detection
The system detects changes to `ScriptSlot.properties` each frame (via JSON snapshot comparison). When a property changes:
- Entity-type properties are re-hydrated as `LuaEntity` objects.
- `onPropertyChanged(self, key, value)` is called if defined.

---

## 7. Lifecycle Hooks

### REQ-HOOK-01: Complete Hook Table

| Hook | Signature | When | Guard-skippable? |
|------|-----------|------|-------------------|
| `init` | `init(self)` | Once at scene Play start | No |
| `onEnable` | `onEnable(self)` | Slot disabled → enabled | No |
| `earlyUpdate` | `earlyUpdate(self, dt)` | Every frame, before physics | Yes |
| `update` | `update(self, dt)` | Every frame, after physics | Yes |
| `lateUpdate` | `lateUpdate(self, dt)` | Every frame, after flush | Yes |
| `onCollisionEnter` | `onCollisionEnter(self, other)` | Collision start | No |
| `onCollisionExit` | `onCollisionExit(self, other)` | Collision end | No |
| `onPropertyChanged` | `onPropertyChanged(self, key, value)` | Property changed from editor/script | No |
| `onDisable` | `onDisable(self)` | Slot enabled → disabled | No |
| `onDestroy` | `onDestroy(self)` | Slot removed or entity destroyed | No |

### REQ-HOOK-02: All Hooks Are Optional

### REQ-HOOK-03: Collision Hooks Are Conditional
Only subscribed if the script defines them AND the entity has a collider/rigidBody.

---

## 8. `self` Object & OOP Access

### REQ-SELF-01: Self Table Structure

| Field | Type | Description |
|-------|------|-------------|
| `self.id` | `string` | The entity ID |
| `self.slotId` | `string` | The slot ID |
| `self.state` | `table` | Per-slot persistent state |
| `self.properties` | `table` | Read-only script properties |
| `self.<entityProp>` | `LuaEntity` | Auto-hydrated entity refs from schema |
| `self.<resourceProp>` | typed resource | Auto-hydrated resource refs from schema |

### REQ-SELF-02: OOP Entity Methods
`self` inherits transform and physics methods from `__EntityMT`:
```lua
self:getPosition()        --> { x, y, z }
self:setPosition(x, y, z)
self:getRotation()        --> { x, y, z }
self:setRotation(x, y, z)
self:lookAt(x, y, z)
self:getForward()         --> { x, y, z }
self:applyImpulse(x, y, z)
self:getLinearVelocity()  --> { x, y, z }
```

### REQ-SELF-03: Universal Component Access (UCA)
Any ECS component is accessible via dot notation:
```lua
entity.pointLight.intensity = 5.0
entity.standardMaterial.metalness = 0.8
local width = entity.boxGeometry.width
```
Component proxies use `__ComponentMT` metatables that delegate to `getComponentProperty`/`setComponentProperty`.

### REQ-SELF-04: Dynamic Component Management
```lua
entity:addComponent("pointLight", { intensity = 2 })
entity:removeComponent("pointLight")
```

---

## 9. Cross-Script Communication

### REQ-CROSS-01: Script Property Proxy
Scripts can read and write properties of other scripts on any referenced entity:
```lua
self.target.scripts.health_bar.currentHp = 50
local speed = self.target.scripts.first_person_move.speed
```
Writing triggers `onPropertyChanged` in the target script.

### REQ-CROSS-02: Event Bus
Scene-scoped event bus for decoupled communication:
```lua
scene.fireEvent("PlayerDied", { entityId = self.id })
scene.onEvent(self, "PlayerDied", function(data) ... end)
```

### REQ-CROSS-03: Reserved Events

| Event | Data | Fired by |
|-------|------|----------|
| `"SceneReady"` | `{}` | ScriptSystem, after all `init()` |
| `"EntityAdded"` | `{ entityId }` | ScriptSystem |
| `"EntityRemoved"` | `{ entityId }` | ScriptSystem |

---

## 10. Math Extensions

### REQ-MATH-01: Math Bridge
The engine exposes `math.ext` to Lua with:
- `math.ext.lerp(a, b, t)` — linear interpolation.
- `math.ext.clamp(v, min, max)` — value clamping.
- `math.ext.easing` — table of easing functions.

### REQ-MATH-02: Easing Functions
Available via `math.ext.easing.<name>(t)`:
`linear`, `smoothstep`, `quadIn`, `quadOut`, `quadInOut`, `cubicIn`, `cubicOut`, `cubicInOut`,
`sineIn`, `sineOut`, `sineInOut`, `expIn`, `expOut`, `circleIn`, `circleOut`, `bounceOut`.

---

## 11. Lua Sandbox

### REQ-LUA-01: Runtime
Use [Wasmoon](https://github.com/ceifa/wasmoon) (Lua 5.4 compiled to WASM).

### REQ-LUA-02: Instruction Limit
Each hook invocation is capped. Exceeding the limit terminates the hook and logs a warning.

### REQ-LUA-03: Sandbox Restrictions
The Lua environment must NOT expose: `os`, `io`, `loadfile`, `dofile`, `debug`.

### REQ-LUA-04: Error Isolation
Lua errors are caught with `pcall`, logged, and the slot is disabled. The engine does not crash.

### REQ-LUA-05: EmmyLua Type Definitions
A `duckengine.d.lua` file provides full autocompletion annotations for the bridge API, entity methods, component proxies, math extensions, and resource types.

---

## 12. Editor Scripting (Separate Context)

### REQ-EDITOR-01: Separate Sandbox
Editor scripts run in a **separate** `LuaEngine` instance from game scripts. They have full scene access because they ARE the editor.

### REQ-EDITOR-02: Editor Script API

| Capability | Game Scripts | Editor Scripts |
|---|---|---|
| Scope | Single entity (`self`) | Entire scene |
| Lifecycle | `update(dt)` at 60fps | Event-driven |
| Scene queries | ❌ No globals | ✅ Full access |
| Physics writes | ✅ | ❌ Restricted |
| Persistence | In entity's ScriptComponent | Loaded as editor plugins |
| Runs in | Game runtime | Editor only |

### REQ-EDITOR-03: Editor Hooks
Editor scripts define event-driven hooks:
- `onSelectionChanged(self, selectedEntities)`
- `onEntityAdded(self, entity)` / `onEntityRemoved(self, entityId)`
- `onGizmoAction(self, entity, action)`
- `onInspectorRender(self)` — returns custom inspector UI data.
- `onMenuAction(self, actionId)`

### REQ-EDITOR-04: Editor Script Schema
Editor scripts declare `editorOnly = true` in their schema:
```lua
schema = {
    name = "Grid Snap Tool",
    editorOnly = true,
}
```

---

## 13. Built-in Scripts

### REQ-BUILTIN-01: Script Library

| Built-in Script | Purpose |
|---|---|
| `first_person_move.lua` | WASD movement (kinematic) |
| `first_person_physics_move.lua` | WASD movement (physics-based) |
| `mouse_look.lua` | Mouse-driven camera rotation |
| `orbit_camera.lua` | Circular orbit around a target entity |
| `look_at_entity.lua` | Smooth rotation to face a target (rotation only) |
| `look_at_point.lua` | Face a fixed world point |
| `follow_entity.lua` | Kinematic follow with delay buffer |
| `follow_entity_physics.lua` | Physics-based follow with impulses |

### REQ-BUILTIN-02: Zero Boilerplate
Built-in scripts use managed references and schema guards. They do NOT contain manual `scene.getEntity()` calls or redundant null-checks for required dependencies.

---

## 14. Legacy Component Deprecation

### REQ-DEP-01: Three-Phase Migration
**Phase 1 — Coexistence:** Both legacy components and scripts work simultaneously.
**Phase 2 — Auto-Migration:** Scene deserialization auto-converts legacy components to script slots.
**Phase 3 — Removal:** Legacy component classes are deleted.

### REQ-DEP-02: Non-Deprecated Components
Rendering, geometry, material, light, collider/physics, camera, and transform components are NOT deprecated.

---

## 15. Editor Integration

### REQ-ED-01: Script Slot Inspector
The Inspector shows slots with: script name, enable toggle, properties panel, execution order, remove button.

### REQ-ED-02: Add Script Slot
An "Add Script" button opens a resource picker.

### REQ-ED-03: Script Editor
Scripts are edited in the Resource Browser with Monaco + Lua syntax + EmmyLua annotations.

### REQ-ED-04: Property Types in Inspector
Schema property types are rendered with appropriate editor widgets:
- `entity` → Entity picker dropdown
- `material` / `mesh` / `skybox` → Resource picker filtered by kind
- `prefab` → Prefab picker
- `number` → Numeric input with optional min/max/step
- `string` → Text input
- `vec3` → Three-field vector input

---

## Requirement Traceability

| Requirement | Area |
|---|---|
| REQ-SC-01..06 | ScriptComponent design |
| REQ-SCHEMA-01..05 | Declarative schema & dependency injection |
| REQ-RES-01..03 | Typed resource references & preloading |
| REQ-PREFAB-01..05 | Prefab system & GPU sharing |
| REQ-SYS-01..07 | ScriptSystem lifecycle & guards |
| REQ-HOOK-01..03 | Lifecycle hooks |
| REQ-SELF-01..04 | Self object, OOP, UCA, dynamic components |
| REQ-CROSS-01..03 | Cross-script communication |
| REQ-MATH-01..02 | Math extensions & easing |
| REQ-LUA-01..05 | Sandbox safety |
| REQ-EDITOR-01..04 | Editor scripting context |
| REQ-BUILTIN-01..02 | Built-in script library |
| REQ-DEP-01..02 | Legacy migration |
| REQ-ED-01..04 | Editor UI integration |
