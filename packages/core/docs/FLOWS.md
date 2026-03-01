# Duck Engine System Flows & Diagrams

## Overview

This document provides visual diagrams and flow charts to help understand how Duck Engine's core systems interact and process data.

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                       │
│                     (packages/client)                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ depends on
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      DUCK ENGINE CORE                          │
│                     (@duckengine/core)                         │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │     ECS      │  │  Scripting   │  │   Physics    │        │
│  │    System    │  │    System    │  │   Abstracts  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Ports (Interfaces)                           │ │
│  │  IRenderingEngine │ IPhysicsSystem │ ITextureResolver   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ implemented by
                              ▼
      ┌─────────────────────────────────────────┐
      │                                         │
      ▼                                         ▼
┌──────────────┐                      ┌──────────────┐
│  Rendering   │                      │   Physics    │
│  Adapters    │                      │   Adapters   │
│              │                      │              │
│ Three.js     │                      │   Rapier     │
└──────────────┘                      └──────────────┘
```

## Scene Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCENE LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

  Scene Created
       │
       ▼
  ┌─────────────────┐
  │ setupAsync()    │──┐
  └─────────────────┘  │
       │               │ Initialize Rendering Engine
       │               │ Initialize Physics System
       │               │ Initialize Script System
       │               │ Load Textures & Assets
       │               └─────────────────────────────┐
       ▼                                             │
  ┌─────────────────┐                                │
  │ onEnter()       │                                │
  └─────────────────┘                                │
       │                                             │
       │ Create Entities                             │
       │ Setup Initial State                         │
       │                                             │
       ▼                                             ▼
  ┌─────────────────────────────────────────────────────┐
  │              MAIN GAME LOOP                         │
  │                                                     │
  │  ┌─────────────┐                                   │
  │  │ update(dt)  │──┐                                │
  │  └─────────────┘  │                                │
  │        │          │                                │
  │        ▼          │                                │
  │  ┌──────────────────────┐                         │
  │  │ ScriptSystem         │                         │
  │  │  - earlyUpdate(dt)   │                         │
  │  │  - update(dt)        │                         │
  │  │  - lateUpdate(dt)    │                         │
  │  └──────────────────────┘                         │
  │        │                                            │
  │        ▼                                            │
  │  ┌──────────────────────┐                         │
  │  │ PhysicsSystem        │                         │
  │  │  - step(dt)          │                         │
  │  └──────────────────────┘                         │
  │        │                                            │
  │        ▼                                            │
  │  ┌──────────────────────┐                         │
  │  │ RenderSyncSystem     │                         │
  │  │  - sync changes      │                         │
  │  └──────────────────────┘                         │
  │        │                                            │
  │        ▼                                            │
  │  ┌──────────────────────┐                         │
  │  │ RenderingEngine      │                         │
  │  │  - render()          │                         │
  │  └──────────────────────┘                         │
  │                                                     │
  └─────────────────────────────────────────────────────┘
       │
       │ Scene Change Event
       ▼
  ┌─────────────────┐
  │ onExit()        │
  └─────────────────┘
       │
       │ Cleanup Entities
       │ Destroy Resources
       │ Unload Assets
       ▼
  Scene Destroyed
```

## Entity Component Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   ENTITY CREATION & COMPOSITION                   │
└──────────────────────────────────────────────────────────────────┘

  new Entity("player")
       │
       ▼
  ┌─────────────────────────────┐
  │ Entity Constructor          │
  │  - Assign unique ID         │
  │  - Create Transform         │
  │  - Initialize component map │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ addComponent(component)     │
  └─────────────────────────────┘
       │
       ├──► Validate Component
       │     ├─ Check unique constraint
       │     ├─ Check required deps
       │     └─ Check conflicts
       │
       ├──► component.setEntityId(id)
       │
       ├──► components.set(type, component)
       │
       └──► Notify Observers
            │
            ▼
       ┌────────────────────────┐
       │ Component Observers    │
       │  - RenderSyncSystem    │
       │  - ScriptSystem        │
       │  - Custom Systems      │
       └────────────────────────┘
            │
            ▼
       Create/Update Render Object
       Register Scripts
       Sync Physics


┌──────────────────────────────────────────────────────────────────┐
│                     COMPONENT REMOVAL FLOW                        │
└──────────────────────────────────────────────────────────────────┘

  removeComponent(type)
       │
       ▼
  ┌─────────────────────────────┐
  │ Validate Removal            │
  │  - Check if other           │
  │    components require it    │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ Notify Observers            │
  │  - onComponentRemoved()     │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ component.notifyRemoved()   │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ components.delete(type)     │
  └─────────────────────────────┘
```

## Script System Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  SCRIPT SYSTEM INITIALIZATION                     │
└──────────────────────────────────────────────────────────────────┘

  ScriptSystem.setupAsync(entities, scene)
       │
       ▼
  ┌─────────────────────────────┐
  │ ScriptRuntime.setup()       │
  │  - Create Lua engine        │
  │  - Load sandbox modules     │
  │    1. sandbox_security.lua  │
  │    2. sandbox_metatables.lua│
  │    3. sandbox_hydration.lua │
  │    4. sandbox_runtime.lua   │
  │  - Set timeout & globals    │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ Register Lua Bridges        │
  │  - TransformBridge          │
  │  - PhysicsBridge            │
  │  - InputBridge              │
  │  - SceneBridge              │
  │  - TimeBridge               │
  │  - MathBridge               │
  │  - GizmoBridge              │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ Register All Entities       │
  │  with ScriptComponents      │
  └─────────────────────────────┘
       │
       ▼
  For each entity with scripts:
       │
       ▼
  ┌─────────────────────────────────────────────────┐
  │ ScriptEntityRegistry.registerEntity(entity)     │
  └─────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────┐
  │ ScriptEntityRegistry.compileEntity(entity, sc)  │
  └─────────────────────────────────────────────────┘
       │
       ▼
  For each ScriptSlot in ScriptComponent:
       │
       ▼
  ┌───────────────────────────────────────────────────┐
  │ ScriptInstanceManager.compileSlot(entity, slot)   │
  └───────────────────────────────────────────────────┘
       │
       ├──► Load Lua script source
       │
       ├──► Create raw context (LuaSelfFactory)
       │     └─ { entity, slotId, properties, scripts }
       │
       ├──► Execute script in Lua
       │     └─ return { init=fn, update=fn, ... }
       │
       ├──► Call __WrapSelf(rawCtx, schema)
       │     └─ Adds property proxies via metatables
       │
       ├──► Store in Lua globals:
       │     ├─ __SlotHooks[slotId] = hooks
       │     └─ __Contexts[slotId] = wrappedContext
       │
       └──► Store metadata in JS (which hooks exist)
            │
            ▼
       ┌────────────────────────────────────────────┐
       │ ScriptCollisionManager.subscribeIfNeeded() │
       │  - If onCollisionEnter exists              │
       │  - Subscribe to CollisionEventsHub         │
       └────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                    SCRIPT EXECUTION FLOW                          │
└──────────────────────────────────────────────────────────────────┘

  Game Loop calls:
       │
       ▼
  ┌─────────────────────────────┐
  │ ScriptSystem.earlyUpdate(dt)│
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────┐
  │ ScriptLifecycleOrchestrator.earlyUpdate(...)    │
  └─────────────────────────────────────────────────┘
       │
       ▼
  For each entity with scripts (sorted by executionOrder):
       │
       ▼
  For each slot with earlyUpdate hook:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ ScriptRuntime.callHook(slotId,          │
  │                        "earlyUpdate",   │
  │                        dt)              │
  └─────────────────────────────────────────┘
       │
       ├──► Set timeout (Date.now() + 200ms)
       │
       ├──► Get __CallHook from Lua
       │
       ├──► Execute __CallHook(slotId, "earlyUpdate", dt)
       │     │
       │     ├──► Lua retrieves hooks = __SlotHooks[slotId]
       │     │
       │     ├──► Lua retrieves ctx = __Contexts[slotId]
       │     │
       │     └──► Calls hooks.earlyUpdate(ctx, dt)
       │
       └──► Catch errors, log, continue


  Same flow for:
  - update(dt)
  - lateUpdate(dt)
  - drawGizmos(dt)
```

## Component Observer Pattern Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPONENT OBSERVER PATTERN                           │
└──────────────────────────────────────────────────────────────────┘

  Component property changes:
       │
       ▼
  ┌─────────────────────────────┐
  │ set someProperty(value)     │
  │   this._value = value       │
  │   this.notifyChanged()      │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Component.notifyChanged()                │
  │  - Iterates over all observers          │
  │  - Calls onComponentChanged(entityId,   │
  │                            componentType)│
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Observers Receive Notification:         │
  │                                          │
  │ ┌─────────────────────────────────────┐ │
  │ │ RenderSyncSystem                    │ │
  │ │  - Update render object             │ │
  │ │  - Sync material, geometry, etc.    │ │
  │ └─────────────────────────────────────┘ │
  │                                          │
  │ ┌─────────────────────────────────────┐ │
  │ │ ScriptSystem (optional)             │ │
  │ │  - React to component changes       │ │
  │ └─────────────────────────────────────┘ │
  │                                          │
  │ ┌─────────────────────────────────────┐ │
  │ │ Custom Systems                      │ │
  │ │  - Application-specific logic       │ │
  │ └─────────────────────────────────────┘ │
  └─────────────────────────────────────────┘


EXAMPLE: MeshComponent material change

  mesh.material = "new_material"
       │
       ▼
  Component.notifyChanged()
       │
       ▼
  RenderSyncSystem.onComponentChanged(entityId, "mesh")
       │
       ▼
  Find Three.js Mesh object for entityId
       │
       ▼
  Update Three.js material
       │
       ▼
  Scene renders with new material on next frame
```

## Collision Event Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     COLLISION EVENT FLOW                          │
└──────────────────────────────────────────────────────────────────┘

  Physics Simulation Step
       │
       ▼
  ┌─────────────────────────────┐
  │ PhysicsSystem detects        │
  │ collision between            │
  │ Entity A & Entity B          │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ CollisionEventsHub.fire()                │
  │  - Event: "collision-enter"             │
  │  - Data: { entityA, entityB, ... }      │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ ScriptCollisionManager subscriptions    │
  │  - Finds scripts with onCollisionEnter  │
  └─────────────────────────────────────────┘
       │
       ▼
  For Entity A's scripts with onCollisionEnter:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ ScriptRuntime.callHook(                 │
  │   slotId,                               │
  │   "onCollisionEnter",                   │
  │   entityB                               │
  │ )                                       │
  └─────────────────────────────────────────┘
       │
       ▼
  Lua: hooks.onCollisionEnter(ctx, entityB)
       │
       ▼
  User script logic executes:
  
  function onCollision(other)
    if other.tag == "enemy" then
      self.health = self.health - 10
    end
  end


  Same flow for:
  - collision-exit → onCollisionExit
  - collision-stay → onCollisionStay (if implemented)
```

## Transform Hierarchy Propagation

```
┌──────────────────────────────────────────────────────────────────┐
│              TRANSFORM HIERARCHY PROPAGATION                      │
└──────────────────────────────────────────────────────────────────┘

  Parent Transform Changes:
       │
       ▼
  ┌─────────────────────────────┐
  │ parent.transform.setPosition│
  │          (x, y, z)          │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ Transform marks dirty       │
  │  - worldNeedsUpdate = true  │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │ Notify listeners            │
  └─────────────────────────────┘
       │
       ▼
  For each child transform:
       │
       ▼
  ┌─────────────────────────────┐
  │ child.transform.markDirty() │
  └─────────────────────────────┘
       │
       ▼
  On next world position read:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ child.transform.getWorldPosition()      │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ if worldNeedsUpdate:                    │
  │   - Calculate parent world matrix       │
  │   - Multiply with local matrix          │
  │   - Extract world position/rotation     │
  │   - Cache result                        │
  │   - worldNeedsUpdate = false            │
  └─────────────────────────────────────────┘


EXAMPLE: 3-level hierarchy

  Root (0, 0, 0)
    │
    └─ Parent (5, 0, 0)  → World: (5, 0, 0)
         │
         └─ Child (3, 0, 0) → World: (8, 0, 0)

  Root moves to (10, 0, 0):
    │
    └─ Parent local stays (5, 0, 0) → World: (15, 0, 0)
         │
         └─ Child local stays (3, 0, 0) → World: (18, 0, 0)
```

## Event Bus Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        EVENT BUS FLOW                             │
└──────────────────────────────────────────────────────────────────┘

  Script A fires event:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Scene.fireEvent("player_died", {        │
  │   playerId = "player_1",                │
  │   killer = "enemy_3"                    │
  │ })                                      │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ SceneEventBus.fire(eventName, payload)  │
  └─────────────────────────────────────────┘
       │
       ▼
  Lookup subscribers for "player_died"
       │
       ▼
  For each subscriber:
       │
       ├──► Script B's listener
       │     │
       │     ▼
       │    function(data)
       │      log.info("Script", "Player died: " .. data.playerId)
       │      -- React to event
       │    end
       │
       ├──► Script C's listener
       │     │
       │     ▼
       │    function(data)
       │      -- Update UI
       │      Scene.fireEvent("update_score", { ... })
       │    end
       │
       └──► Script D's listener


SUBSCRIPTION:

  Script B subscribes:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Scene.onEvent(self, "player_died",      │
  │   function(data)                        │
  │     -- Handle event                     │
  │   end                                   │
  │ )                                       │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ SceneEventBus.subscribe(                │
  │   "player_died",                        │
  │   slotId,                               │
  │   callback                              │
  │ )                                       │
  └─────────────────────────────────────────┘
       │
       ▼
  Store in subscribers map:
    "player_died" → [
      { slotId: "slot_1", callback: fn1 },
      { slotId: "slot_2", callback: fn2 },
      ...
    ]


CLEANUP:

  When entity is destroyed:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ ScriptSystem.unregisterEntity(entityId) │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ SceneEventBus.unsubscribeAll(entityId)  │
  │  - Remove all subscriptions             │
  │    for this entity's scripts            │
  └─────────────────────────────────────────┘
```

## Lua-JavaScript Bridge Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                LUA ↔ JAVASCRIPT BRIDGE FLOW                       │
└──────────────────────────────────────────────────────────────────┘

  Lua script calls:
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Transform.setPosition(self.entity,      │
  │                       { x=10, y=0, z=5})│
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Lua engine routes to registered         │
  │ "Transform" global                      │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ TransformBridge.setPosition(            │
  │   target,                               │
  │   vec                                   │
  │ )                                       │
  └─────────────────────────────────────────┘
       │
       ├──► Extract entity ID from target
       │
       ├──► ctx.getEntity(id)
       │     └─ BridgeContext provides entity lookup
       │
       ├──► ent.transform.setPosition(vec.x, vec.y, vec.z)
       │
       └──► Returns to Lua


  Reverse flow (JS → Lua):
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ ScriptRuntime.callHook(slotId,          │
  │                        "update",        │
  │                        dt)              │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Get __CallHook from Lua globals         │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ __CallHook(slotId, "update", dt)        │
  └─────────────────────────────────────────┘
       │
       ▼
  Lua-side:
    - Retrieve hooks = __SlotHooks[slotId]
    - Retrieve ctx = __Contexts[slotId]
    - Call hooks.update(ctx, dt)
       │
       ▼
    User script logic executes in Lua


DATA SERIALIZATION ISSUE (Why we store in Lua):

  Lua Table with Metatable:
    {
      x = 10,
      __index = function() ... end
    }
       │
       ▼
  Cross to JavaScript (wasmoon serialization)
       │
       ▼
  JavaScript Object (metatable LOST):
    {
      x: 10
      // __index is gone! ❌
    }

  SOLUTION: Keep __Contexts and __SlotHooks in Lua
    - Never serialize to JS
    - Only pass opaque slotId strings
    - Lua preserves metatables
```

## Performance Optimization Points

```
┌──────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE OPTIMIZATION                         │
└──────────────────────────────────────────────────────────────────┘

1. Transform World Calculation (Lazy Evaluation)
   ─────────────────────────────────────────────
   Parent moves:
     - Don't recalculate child world transforms immediately
     - Mark as dirty: worldNeedsUpdate = true
     - Recalculate only when worldPosition is read
   
   Benefit: Avoid redundant calculations if world transform not used


2. Component Observer Batching (Future)
   ────────────────────────────────────
   Multiple property changes:
     1. setMaterial("a")  → Notify
     2. setCastShadow(true) → Notify
     3. setReceiveShadow(true) → Notify
   
   Potential improvement:
     - Batch notifications
     - Flush at end of frame
     - Single render update


3. Script Compilation Caching
   ───────────────────────────
   Script compiled once:
     - Stored in __SlotHooks[slotId]
     - Hooks are Lua functions (native)
     - No re-parsing on each call
   
   Benefit: Fast hook execution


4. Entity Lookup Optimization
   ───────────────────────────
   Bad:
     function update(dt)
       local enemy = Scene.findByName("Enemy") -- Slow!
     end
   
   Good:
     function init()
       self.enemy = Scene.findByName("Enemy") -- Cache
     end
     
     function update(dt)
       -- Use cached reference
     end


5. Physics Collision Subscriptions
   ─────────────────────────────────
   Only entities with collision hooks subscribe:
     - onCollisionEnter exists → subscribe
     - Hook removed → unsubscribe
   
   Benefit: Don't process collision events for entities that don't care


6. Event Bus Cleanup
   ──────────────────
   Entity destroyed:
     - Automatically unsubscribe from all events
     - Prevent memory leaks
   
   Benefit: No orphaned event listeners
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                               │
└──────────────────────────────────────────────────────────────────┘

Component Addition Error:
   │
   ▼
entity.addComponent(invalidComponent)
   │
   ▼
Component.validate(entity)
   │
   ├─ Unique constraint violated → Error
   ├─ Required dependency missing → Error
   └─ Conflicting component exists → Error
   │
   ▼
Throw Error with detailed message
   │
   ▼
Core Logger captures error
   │
   ▼
User sees error in console


Script Execution Error:
   │
   ▼
ScriptRuntime.execute(hook)
   │
   ▼
try {
  hook.call()
} catch (err) {
  CoreLogger.error("Lua execution failed: " + err)
  return false // Don't crash engine
}
   │
   ▼
Game continues (other scripts still run)


Safe Operations (Result Pattern):
   │
   ▼
const result = entity.safeAddComponent(component)
   │
   ▼
if (result.ok) {
  // Success
} else {
  // result.error contains
  //  - code: "invalid-component"
  //  - message: "Detailed error"
  //  - context: { additional data }
}
```

## Summary

This document provides visual flows for:

1. **System Architecture** - How packages and systems are layered
2. **Scene Lifecycle** - From creation to destruction
3. **Entity Composition** - Adding/removing components
4. **Script System** - Lua compilation and execution
5. **Component Observers** - Reactive updates
6. **Collision Events** - Physics to script communication
7. **Transform Hierarchy** - Parent-child propagation
8. **Event Bus** - Cross-entity communication
9. **Lua-JS Bridge** - How APIs cross the boundary
10. **Performance** - Optimization strategies
11. **Error Handling** - Graceful failure patterns

These flows help developers and AI agents understand:
- **Where to find functionality** (which subsystem handles what)
- **How data flows** through the system
- **When things happen** (initialization, per-frame, on-event)
- **Why architectural decisions** were made (e.g., storing in Lua)

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [ECS System](./ECS.md)
- [Lua Scripting System](./SCRIPTING.md)
- [Scripting Guide](./SCRIPTING_GUIDE.md)
