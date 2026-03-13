# Duck Engine Lua Scripting System

## Overview

The Lua scripting system enables developers to define entity behavior using **Lua scripts** instead of hard-coding logic in TypeScript. Scripts run in a **sandboxed environment** with access to a type-safe API for manipulating entities, physics, input, and more.

## Architecture

### Core Components

The scripting system is composed of several interconnected subsystems:

```
┌─────────────────────────────────────────────────────────────┐
│                      ScriptSystem                            │
│  (Main Orchestrator - Coordinates All Subsystems)            │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ScriptRuntime│  │ScriptInstance│  │ScriptEntity  │
│              │  │   Manager    │  │   Registry   │
│ (Lua Engine) │  │ (Compilation)│  │(Registration)│
└──────────────┘  └──────────────┘  └──────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│ScriptBridge  │                    │ ScriptSlot   │
│  Registry    │◄───────────────────┤  Collision   │
│ (Lua APIs)   │                    │   Manager    │
└──────────────┘                    └──────────────┘
        │
        ▼
┌──────────────┐
│ScriptLifecycle│
│ Orchestrator │
│(Hook Exec)   │
└──────────────┘
```

### Component Descriptions

#### 1. **ScriptSystem**
The main orchestrator that coordinates all scripting subsystems.

**Responsibilities**:
- Initialize the Lua runtime
- Register and unregister entities with scripts
- Execute lifecycle hooks (earlyUpdate, update, lateUpdate, drawGizmos)
- Manage scene change events

#### 2. **ScriptRuntime**
Manages the **Wasmoon** Lua engine instance.

**Responsibilities**:
- Load system Lua modules (sandbox security, metatables, runtime)
- Provide safe hook execution with timeout protection
- Expose a global `print()` and `log` API

**Key Features**:
- **Timeout Protection**: Each Lua execution has a 200ms timeout
- **Sandboxed Environment**: No access to file system, OS, or debug hooks
- **Persistent State**: Lua globals and module state persist across hook calls

#### 3. **ScriptInstanceManager**
Compiles user scripts and stores instances **entirely in Lua**.

**Why Store in Lua?**
Wasmoon (the Lua ↔ JavaScript bridge) **destroys metatables** when Lua tables cross to JavaScript. By keeping script contexts (`self`) and hook tables (`__SlotHooks`) in Lua, we preserve:
- Entity proxies with `__index` and `__newindex`
- Vec3 objects with operator overloading
- The `self` table's metatable-based property access

**Responsibilities**:
- Compile Lua scripts and wrap them with `__WrapSelf`
- Store compiled hooks in `__SlotHooks[slotId]`
- Store script contexts in `__Contexts[slotId]`
- Detect property changes and trigger `onPropertyChanged`

#### 4. **ScriptEntityRegistry**
Tracks which entities have script components and compiles their slots.

**Responsibilities**:
- Register entities when `ScriptComponent` is added
- Compile all script slots when entity is registered
- Unregister entities when they are destroyed
- Return compiled slot IDs for lifecycle execution

#### 5. **ScriptCollisionManager**
Subscribes to physics collision events for entities with collision hooks.

**Responsibilities**:
- Subscribe entities with `onCollisionEnter` / `onCollisionExit` to the `CollisionEventsHub`
- Route collision events to the appropriate script hooks
- Unsubscribe when entities are removed

#### 6. **ScriptBridgeRegistry**
Registers JavaScript APIs in the Lua environment.

**Registered Bridges**:
- **TransformBridge** - Position, rotation, scale, lookAt
- **PhysicsBridge** - Raycast, apply forces, velocity
- **InputBridge** - Keyboard, mouse, gamepad input
- **SceneBridge** - Entity creation, component manipulation, events
- **TimeBridge** - Delta time, total time
- **MathBridge** - Vector operations (via `math_ext.lua`)
- **GizmoBridge** - Debug gizmos (lines, spheres, labels)

#### 7. **ScriptLifecycleOrchestrator**
Executes script hooks in order of execution priority.

**Lifecycle Phases**:
1. **earlyUpdate** - Physics input, pre-simulation logic
2. **update** - Main game logic
3. **lateUpdate** - Camera updates, post-simulation logic
4. **drawGizmos** - Debug visualization

**Hook Execution**:
- Hooks are called via `runtime.callHook(slotId, hookName, ...args)`
- Slots are executed in **executionOrder** (lowest first)
- Lua errors are caught and logged, but don't crash the engine

## Lua Sandbox

### Sandboxed Environment

User scripts run in a **restricted Lua environment**:

**Disabled Globals** (for security):
```lua
os = nil       -- No file system access
io = nil       -- No I/O operations
debug = nil    -- No debug hooks
loadfile = nil -- No arbitrary code loading
dofile = nil   -- No file execution
```

**Available Globals**:
```lua
print(...)              -- Console logging
log.info(system, msg)   -- Structured logging
log.warn(system, msg)
log.error(system, msg)
log.debug(system, msg)

Script.*                -- Built-in script references
```

### Script Constants

The `Script` table provides references to built-in scripts:

```lua
Script.FirstPersonMove        = "builtin://first_person_move.lua"
Script.MouseLook              = "builtin://mouse_look.lua"
Script.OrbitCamera            = "builtin://orbit_camera.lua"
Script.MoveToPoint            = "builtin://move_to_point.lua"
-- ... etc
```

**Usage**:
```lua
-- Access a sibling script's properties
local mover = self.scripts[Script.MoveToPoint]
mover.targetPoint = { 10, 0, 5 }
```

### System Modules

The sandbox runtime loads four system modules (in order):

1. **`sandbox_security.lua`**
   - Clears dangerous globals
   - Defines `Script` constants

2. **`sandbox_metatables.lua`**
   - Defines proxy metatables (`__EntityMT`, `__SelfMT`, `__Vec3MT`, etc.)
   - Enables property access (`self.position`, `entity.transform`)

3. **`sandbox_hydration.lua`**
   - Implements `__WrapValue` (converts JS objects to Lua proxies)
   - Implements `__WrapSelf` (wraps script context with schema-based properties)

4. **`sandbox_runtime.lua`**
   - Defines `__Contexts` and `__SlotHooks` (Lua-side storage)
   - Implements `__CallHook` (executes hooks by slotId)
   - Implements `__StoreSlot`, `__RemoveSlot`, `__UpdateProperty`

## Script Lifecycle Hooks

Scripts define behavior via **hooks** (special function names):

### Initialization & Teardown

#### `init()`
Called once when the script is first loaded.

```lua
function init()
  log.info("Script", "Initializing player controller")
  self.speed = 5.0
end
```

#### `onEnable()`
Called when the script (or entity) is enabled.

```lua
function onEnable()
  log.info("Script", "Player enabled")
end
```

#### `onDisable()`
Called when the script (or entity) is disabled.

```lua
function onDisable()
  log.info("Script", "Player disabled")
end
```

#### `onDestroy()`
Called when the entity is destroyed.

```lua
function onDestroy()
  log.info("Script", "Cleaning up resources")
end
```

### Update Loops

#### `earlyUpdate(dt)`
Runs before physics simulation.

**Use Cases**:
- Read input for physics forces
- Pre-simulation logic

```lua
function earlyUpdate(dt)
  if Input.isKeyPressed('w') then
    Physics.applyForce(self.entity, { 0, 0, -10 })
  end
end
```

#### `update(dt)`
Main game logic, runs every frame.

```lua
function update(dt)
  if Input.isKeyPressed('space') and self.onGround then
    self.velocity.y = 10 -- Jump
  end
end
```

#### `lateUpdate(dt)`
Runs after physics simulation.

**Use Cases**:
- Camera following (smooth follow after physics)
- Animation blending
- Post-processing

```lua
function lateUpdate(dt)
  -- Camera follow player
  local playerPos = self.target.transform.position
  Transform.setPosition(self.entity, playerPos)
end
```

### Event Hooks

#### `onCollision(other)`
Called when a collision occurs (requires `ColliderComponent`).

**Parameters**:
- `other` - The other entity involved in the collision

```lua
function onCollision(other)
  log.info("Script", "Hit: " .. other.id)
  
  if other.tag == "enemy" then
    self.health = self.health - 10
  end
end
```

**Variants**:
- `onCollisionEnter(other)` - Collision starts
- `onCollisionExit(other)` - Collision ends
- `onCollisionStay(other)` - Collision continues (not yet implemented)

#### `onPropertyChanged(key, value)`
Called when a script property is modified externally (e.g., from the editor).

```lua
function onPropertyChanged(key, value)
  if key == "speed" then
    log.info("Script", "Speed changed to: " .. value)
  end
end
```

### Debug Hooks

#### `onDrawGizmos(dt)`
Called during the gizmo rendering pass.

**Use Cases**:
- Visualize AI paths
- Show trigger volumes
- Debug rays and vectors

```lua
function onDrawGizmos(dt)
  local pos = Transform.getPosition(self.entity)
  Gizmo.drawSphere(pos, 1.0, { r = 1, g = 0, b = 0 })
  Gizmo.drawLabel(pos, "Player", { r = 1, g = 1, b = 1 })
end
```

## Script Properties

Scripts can define a **schema** to expose editable properties to the editor:

```lua
local schema = {
  properties = {
    speed = { type = "number", default = 5.0 },
    maxHealth = { type = "number", default = 100 },
    canJump = { type = "boolean", default = true },
    targetEntity = { type = "entity", default = nil }
  }
}

function update(dt)
  -- Access properties via self
  local moveSpeed = self.speed
end

return schema
```

**Property Types**:
- `number` - Numeric values
- `boolean` - True/false
- `string` - Text
- `entity` - Entity reference (entity ID)
- `vec3` - 3D vector (array `[x, y, z]`)
- `color` - RGB color (object `{ r, g, b }`)

**Property Access**:
```lua
self.speed          -- Read property
self.speed = 10     -- Write property
```

When properties change externally:
- `__UpdateProperty` updates the Lua-side value
- `onPropertyChanged(key, value)` is called

## Lua Bridges (JavaScript APIs)

### Transform API

Access entity transforms from Lua:

```lua
-- Get position
local pos = Transform.getPosition(self.entity)
print(pos.x, pos.y, pos.z)

-- Set position
Transform.setPosition(self.entity, { x = 10, y = 0, z = 5 })

-- Get rotation (Euler angles in degrees)
local rot = Transform.getRotation(self.entity)

-- Set rotation
Transform.setRotation(self.entity, { x = 0, y = 90, z = 0 })

-- Get scale
local scale = Transform.getScale(self.entity)

-- Set scale
Transform.setScale(self.entity, { x = 2, y = 2, z = 2 })

-- Look at a point
Transform.lookAt(self.entity, { x = 0, y = 0, z = 0 })

-- Get direction vectors
local forward = Transform.getForward(self.entity)
local right = Transform.getRight(self.entity)
local up = Transform.getUp(self.entity)
```

**Entity Target**:
Most Transform functions accept:
- An entity ID string: `"player_1"`
- An entity proxy: `self.entity`
- Another entity: `other` (from collision)

### Physics API

Interact with the physics system:

```lua
-- Apply force
Physics.applyForce(self.entity, { x = 0, y = 10, z = 0 })

-- Apply impulse (instant force)
Physics.applyImpulse(self.entity, { x = 0, y = 5, z = 0 })

-- Set velocity
Physics.setVelocity(self.entity, { x = 0, y = 0, z = -5 })

-- Get velocity
local vel = Physics.getVelocity(self.entity)

-- Raycast
local hit = Physics.raycast({
  origin = { x = 0, y = 10, z = 0 },
  direction = { x = 0, y = -1, z = 0 },
  maxDistance = 100
})

if hit then
  print("Hit entity:", hit.entity.id)
  print("Hit point:", hit.point.x, hit.point.y, hit.point.z)
  print("Hit normal:", hit.normal.x, hit.normal.y, hit.normal.z)
end
```

### Input API

Read player input:

```lua
-- Keyboard
if Input.isKeyPressed('w') then
  -- Move forward
end

if Input.isKeyDown('space') then
  -- Jump
end

if Input.isKeyReleased('e') then
  -- Interact
end

-- Mouse
local mousePos = Input.getMousePosition()
local mouseDelta = Input.getMouseDelta()

if Input.isMouseButtonPressed(0) then -- Left click
  -- Fire weapon
end

-- Gamepad
if Input.isGamepadButtonPressed(0, 'A') then
  -- Jump
end

local leftStick = Input.getGamepadAxis(0, 'LeftStickX')
```

### Scene API

Manipulate the scene and entities:

```lua
-- Fire custom event
Scene.fireEvent("player_died", { playerId = "player_1" })

-- Subscribe to event
Scene.onEvent(self, "player_died", function(data)
  log.info("Script", "Player died: " .. data.playerId)
end)

-- Add component to entity
Scene.addComponent("enemy_1", "mesh", { geometry = "box" })

-- Remove component
Scene.removeComponent("enemy_1", "mesh")

-- Check if component exists
if Scene.hasComponent(self.entity, "rigidbody") then
  -- Physics logic
end

-- Get component property
local mass = Scene.getComponentProperty(self.entity, "rigidbody", "mass")

-- Set component property
Scene.setComponentProperty(self.entity, "rigidbody", "mass", 2.0)

-- Cross-script property access
local slots = Scene.getScriptSlotNames(self.entity)
local moverSpeed = Scene.getScriptSlotProperty(
  self.entity, 
  Script.MoveToPoint, 
  "speed"
)
Scene.setScriptSlotProperty(self.entity, Script.MoveToPoint, "speed", 10)
```

### Time API

Access time information:

```lua
-- Delta time (time since last frame)
local dt = Time.deltaTime()

-- Total elapsed time
local totalTime = Time.time()
```

**Note**: `dt` is also passed to update hooks: `update(dt)`, `earlyUpdate(dt)`, `lateUpdate(dt)`.

### Math API

Extended math utilities (defined in `math_ext.lua`):

```lua
-- Vector operations
local v1 = { x = 1, y = 0, z = 0 }
local v2 = { x = 0, y = 1, z = 0 }

local sum = math.vec3.add(v1, v2)
local diff = math.vec3.sub(v1, v2)
local scaled = math.vec3.mul(v1, 2.0)
local length = math.vec3.length(v1)
local normalized = math.vec3.normalize(v1)
local dot = math.vec3.dot(v1, v2)
local cross = math.vec3.cross(v1, v2)
local distance = math.vec3.distance(v1, v2)

-- Lerp (linear interpolation)
local lerped = math.lerp(0, 10, 0.5) -- 5.0

-- Clamp
local clamped = math.clamp(value, 0, 100)
```

### Gizmo API (Debug Visualization)

Draw debug shapes in the scene:

```lua
function onDrawGizmos(dt)
  local pos = Transform.getPosition(self.entity)
  
  -- Draw line
  Gizmo.drawLine(
    { x = 0, y = 0, z = 0 },
    { x = 10, y = 0, z = 0 },
    { r = 1, g = 0, b = 0 } -- Red
  )
  
  -- Draw sphere
  Gizmo.drawSphere(pos, 1.0, { r = 0, g = 1, b = 0 }) -- Green
  
  -- Draw label (world-space text)
  Gizmo.drawLabel(pos, "Enemy", { r = 1, g = 1, b = 1 }) -- White
end
```

## Script Compilation & Storage

### Compilation Flow

1. **Entity Registered**: `ScriptSystem.registerEntity(entity)` is called
2. **Slot Compilation**: For each `ScriptSlot` in the `ScriptComponent`:
   - `ScriptInstanceManager.compileSlot(entity, slot)` is invoked
   - Lua source is loaded (from `scriptOverrides` or `BuiltInScripts`)
   - Raw context (`self`) is created via `LuaSelfFactory.create(entity, slot)`
   - Lua script is executed: `return { init = function() ... end, update = function() ... end }`
   - Result is wrapped with `__WrapSelf(rawCtx, schema)` to add property proxies
   - Hooks and context are stored in `__SlotHooks[slotId]` and `__Contexts[slotId]`
3. **Instance Metadata**: `ScriptInstanceManager` stores which hooks exist (JS-side)
4. **Collision Subscription**: If `onCollisionEnter` / `onCollisionExit` exist, subscribe to `CollisionEventsHub`

### Why Store in Lua?

Wasmoon (the Lua-JS bridge) **strips metatables** when Lua tables cross to JavaScript:

```lua
-- In Lua
local t = { x = 10 }
setmetatable(t, { __index = function() return 42 end })

-- cross to JS
local jsResult = someJsFunction(t)

-- Back in Lua
-- jsResult has lost its metatable! ❌
```

By keeping `__Contexts` and `__SlotHooks` entirely in Lua:
- Entity proxies retain `__index` / `__newindex` behavior
- Vec3 objects retain operator overloads
- `self` table retains property accessors

### Property Synchronization

When script properties change externally (e.g., editor):

1. `ScriptInstanceManager.syncProperties(slot)` compares JSON snapshots
2. Changed properties trigger `__UpdateProperty(slotId, key, value, propDef)`
3. `__UpdateProperty` updates the Lua-side `self[key]` value
4. `onPropertyChanged(key, value)` hook is called

## Script Context (`self`)

Inside a Lua script, `self` is a proxy table with special properties:

### Built-in Properties

```lua
self.entity        -- Entity proxy (ID, transform, components)
self.slotId        -- Unique slot identifier
self.scripts       -- Table of sibling scripts on the same entity
```

### Custom Properties

Properties defined in the schema are accessible via `self`:

```lua
local schema = {
  properties = {
    speed = { type = "number", default = 5.0 }
  }
}

function update(dt)
  self.speed = self.speed + 1 -- Read and write
end

return schema
```

### Entity Proxy

`self.entity` is a proxy with:

```lua
self.entity.id              -- Entity ID string
self.entity.transform       -- Transform proxy
  .position                 -- { x, y, z }
  .rotation                 -- { x, y, z } (Euler angles)
  .scale                    -- { x, y, z }
```

## Built-in Scripts

Duck Engine includes built-in behavior scripts:

### Movement

- **`first_person_move.lua`** - WASD keyboard movement
- **`first_person_physics_move.lua`** - Physics-based WASD movement
- **`move_to_point.lua`** - Move to a target point

### Camera

- **`orbit_camera.lua`** - Orbit around a target
- **`mouse_look.lua`** - FPS-style mouse camera
- **`smooth_follow.lua`** - Smooth camera follow
- **`follow_entity.lua`** - Direct entity follow

### Utility

- **`look_at_entity.lua`** - Always face another entity
- **`look_at_point.lua`** - Always face a point
- **`rotate_continuous.lua`** - Continuous rotation
- **`billboard.lua`** - Always face camera
- **`destroy_after.lua`** - Self-destruct after timer
- **`spawn_on_interval.lua`** - Spawn entities periodically
- **`waypoint_path.lua`** - Follow a path of waypoints

See [`res/scripts/builtin/`](../res/scripts/builtin/) for implementations.

## Type Definitions

Duck Engine provides **Lua Language Server** type definitions for IDE autocomplete:

**Location**: `res/scripts/types/*.d.lua`

**Files**:
- `core.d.lua` - Core types (Entity, Component, etc.)
- `transform.d.lua` - Transform API
- `physics.d.lua` - Physics API
- `input.d.lua` - Input API
- `scene.d.lua` - Scene API
- `time.d.lua` - Time API
- `math.d.lua` - Math extensions
- `gizmos.d.lua` - Gizmo API
- `entity.d.lua` - Entity proxy
- `builtin_scripts.d.lua` - Built-in script references

**Usage in VSCode**:
1. Install [Lua Language Server extension](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)
2. Type definitions are auto-detected from `res/scripts/types/`
3. Autocomplete and type checking work in Lua scripts

## Testing Scripts

### Unit Testing Lua Logic

Test individual Lua functions by loading them in a test runtime:

```typescript
import { LuaFactory } from 'wasmoon';

test('script calculates damage correctly', async () => {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();
  
  lua.doStringSync(`
    function calculateDamage(baseDamage, multiplier)
      return baseDamage * multiplier
    end
  `);
  
  const calculateDamage = lua.global.get('calculateDamage');
  const result = calculateDamage(10, 2);
  
  expect(result).toBe(20);
});
```

### Integration Testing

Test scripts in a scene with full ECS context:

```typescript
import { Entity, ScriptComponent, ScriptSystem } from '@duckengine/core';
import { SceneTestScaffold } from '../__tests__/utils/SceneTestScaffold';

test('first person move script moves entity', async () => {
  const scaffold = new SceneTestScaffold();
  await scaffold.setupAsync();
  
  const player = new Entity('player');
  const script = new ScriptComponent();
  script.addSlot('builtin://first_person_move.lua');
  player.addComponent(script);
  
  scaffold.scene.addEntity(player);
  
  // Simulate input
  scaffold.setKeyPressed('w', true);
  
  // Run update
  scaffold.scene.scriptSystem.update(0.016);
  
  // Verify entity moved
  expect(player.transform.localPosition.z).toBeLessThan(0);
});
```

## Performance Considerations

### Script Compilation

- Scripts are compiled **once** per slot (on entity registration)
- Compiled hooks are stored in Lua for fast access
- Re-compilation only happens if script source changes

### Hook Execution

- Hooks are called directly in Lua (no re-parsing)
- Execution order is determined by `slot.executionOrder`
- Lua errors are caught and logged (don't crash the engine)

### Timeout Protection

Each hook execution has a **200ms timeout**:
```typescript
lua.global.setTimeout(Date.now() + 200);
```

If a script exceeds 200ms, execution is aborted. This prevents:
- Infinite loops
- Runaway recursion
- Unresponsive game loops

### Memory Management

- Lua uses automatic garbage collection
- Script instances are removed when entities are destroyed
- Event subscriptions are cleaned up on entity removal

## Best Practices

### 1. Keep Scripts Small and Focused

Each script should have a **single responsibility**:

```lua
-- ✅ Good: Focused script
-- health.lua
function takeDamage(amount)
  self.health = self.health - amount
end

-- ❌ Bad: Too many responsibilities
-- player.lua
function update(dt)
  -- Movement, health, inventory, combat, etc.
end
```

### 2. Use Composition

Combine multiple small scripts instead of one monolithic script:

```lua
-- Entity: Player
-- Scripts:
--   - first_person_move.lua
--   - mouse_look.lua
--   - health.lua
--   - inventory.lua
```

### 3. Avoid Expensive Operations in Update

Minimize work in `update()`:

```lua
-- ✅ Good: Cache expensive lookups
function init()
  self.player = Scene.findEntityByName("Player")
end

function update(dt)
  local dist = math.vec3.distance(self.entity.transform.position, self.player.transform.position)
end

-- ❌ Bad: Expensive lookup every frame
function update(dt)
  local player = Scene.findEntityByName("Player") -- Slow!
end
```

### 4. Use Events for Cross-Entity Communication

Instead of polling:

```lua
-- ✅ Good: Event-driven
Scene.onEvent(self, "player_died", function(data)
  -- React to player death
end)

-- ❌ Bad: Polling
function update(dt)
  if player.health <= 0 then
    -- Check every frame
  end
end
```

### 5. Clean Up Resources in onDestroy

```lua
function init()
  self.texture = loadTexture("player.png")
end

function onDestroy()
  -- Clean up resources
  unloadTexture(self.texture)
end
```

## Next Steps

- [Scripting Guide & API Reference](./SCRIPTING_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [ECS System](./ECS.md)
