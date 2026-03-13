# Duck Engine Scripting Guide

## Introduction

This guide provides practical examples and patterns for writing Lua scripts in Duck Engine. It covers common use cases, API references, and best practices for creating entity behaviors.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Examples](#basic-examples)
- [Movement Scripts](#movement-scripts)
- [Camera Scripts](#camera-scripts)
- [Physics & Collision](#physics--collision)
- [Input Handling](#input-handling)
- [Entity Interaction](#entity-interaction)
- [Custom Events](#custom-events)
- [Debug Visualization](#debug-visualization)
- [Complete API Reference](#complete-api-reference)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Your First Script

Create a simple script that logs a message and rotates an entity:

```lua
-- my_first_script.lua

local schema = {
  properties = {
    rotationSpeed = { type = "number", default = 1.0 }
  }
}

function init()
  log.info("MyScript", "Hello from Lua!")
  self.totalTime = 0
end

function update(dt)
  self.totalTime = self.totalTime + dt
  
  -- Rotate entity
  local currentRot = Transform.getRotation(self.entity)
  currentRot.y = currentRot.y + (self.rotationSpeed * dt)
  Transform.setRotation(self.entity, currentRot)
end

return schema
```

### Script Structure

All scripts must return a table (schema) with hooks:

```lua
-- 1. Define schema (optional but recommended)
local schema = {
  name = "My Script",
  description = "What this script does",
  properties = {
    -- Editable properties
  }
}

-- 2. Define hooks
function init()
  -- One-time initialization
end

function update(dt)
  -- Per-frame logic
end

-- ... other hooks

-- 3. Return schema at the end
return schema
```

## Basic Examples

### Simple Timer

```lua
local schema = {
  properties = {
    duration = { type = "number", default = 5.0 },
    autoRestart = { type = "boolean", default = false }
  }
}

function init()
  self.elapsed = 0
  self.isActive = true
end

function update(dt)
  if not self.isActive then return end
  
  self.elapsed = self.elapsed + (dt / 1000)
  
  if self.elapsed >= self.duration then
    log.info("Timer", "Time's up!")
    
    if self.autoRestart then
      self.elapsed = 0
    else
      self.isActive = false
    end
  end
end

return schema
```

### Health System

```lua
local schema = {
  properties = {
    maxHealth = { type = "number", default = 100 },
    currentHealth = { type = "number", default = 100 },
    regenerationRate = { type = "number", default = 0 }
  }
}

function init()
  self.isDead = false
end

function update(dt)
  if self.isDead then return end
  
  -- Regenerate health
  if self.regenerationRate > 0 then
    self.currentHealth = math.min(
      self.currentHealth + (self.regenerationRate * dt / 1000),
      self.maxHealth
    )
  end
end

function takeDamage(amount)
  if self.isDead then return end
  
  self.currentHealth = self.currentHealth - amount
  log.info("Health", "Took " .. amount .. " damage. Health: " .. self.currentHealth)
  
  if self.currentHealth <= 0 then
    self.currentHealth = 0
    self.isDead = true
    Scene.fireEvent("entity_died", { entityId = self.entity.id })
  end
end

function heal(amount)
  if self.isDead then return end
  
  self.currentHealth = math.min(self.currentHealth + amount, self.maxHealth)
  log.info("Health", "Healed " .. amount .. ". Health: " .. self.currentHealth)
end

return schema
```

## Movement Scripts

### Simple Forward Movement

```lua
local schema = {
  properties = {
    speed = { type = "number", default = 5.0 },
    direction = { type = "vec3", default = { 0, 0, -1 } }
  }
}

function update(dt)
  local pos = Transform.getPosition(self.entity)
  local dir = self.direction
  
  -- Normalize direction
  local len = math.sqrt(dir[1]*dir[1] + dir[2]*dir[2] + dir[3]*dir[3])
  if len > 0 then
    dir[1] = dir[1] / len
    dir[2] = dir[2] / len
    dir[3] = dir[3] / len
  end
  
  -- Apply movement
  local speed = self.speed * (dt / 1000)
  pos.x = pos.x + dir[1] * speed
  pos.y = pos.y + dir[2] * speed
  pos.z = pos.z + dir[3] * speed
  
  Transform.setPosition(self.entity, pos)
end

return schema
```

### WASD Character Controller

```lua
local schema = {
  properties = {
    walkSpeed = { type = "number", default = 5.0 },
    runSpeed = { type = "number", default = 10.0 }
  }
}

function update(dt)
  -- Read input
  local forward = 0
  local right = 0
  
  if Input.isKeyPressed('w') then forward = forward - 1 end
  if Input.isKeyPressed('s') then forward = forward + 1 end
  if Input.isKeyPressed('a') then right = right - 1 end
  if Input.isKeyPressed('d') then right = right + 1 end
  
  -- Early exit if no movement
  if forward == 0 and right == 0 then return end
  
  -- Choose speed
  local speed = Input.isKeyPressed('leftshift') and self.runSpeed or self.walkSpeed
  
  -- Get entity direction vectors
  local forwardVec = Transform.getForward(self.entity)
  local rightVec = Transform.getRight(self.entity)
  
  -- Flatten to XZ plane (ignore Y for horizontal movement)
  forwardVec.y = 0
  rightVec.y = 0
  
  -- Build movement vector
  local moveX = forwardVec.x * forward + rightVec.x * right
  local moveZ = forwardVec.z * forward + rightVec.z * right
  
  -- Normalize (prevent faster diagonal movement)
  local len = math.sqrt(moveX * moveX + moveZ * moveZ)
  if len > 0 then
    moveX = moveX / len
    moveZ = moveZ / len
  end
  
  -- Apply movement
  local pos = Transform.getPosition(self.entity)
  local deltaTime = dt / 1000
  pos.x = pos.x + moveX * speed * deltaTime
  pos.z = pos.z + moveZ * speed * deltaTime
  Transform.setPosition(self.entity, pos)
end

return schema
```

### Move To Point

```lua
local schema = {
  properties = {
    targetPoint = { type = "vec3", default = { 0, 0, 0 } },
    speed = { type = "number", default = 5.0 },
    stopDistance = { type = "number", default = 0.1 }
  }
}

function init()
  self.hasReached = false
end

function update(dt)
  if self.hasReached then return end
  
  local pos = Transform.getPosition(self.entity)
  local target = self.targetPoint
  
  -- Calculate direction
  local dx = target[1] - pos.x
  local dy = target[2] - pos.y
  local dz = target[3] - pos.z
  local distance = math.sqrt(dx*dx + dy*dy + dz*dz)
  
  -- Check if reached
  if distance <= self.stopDistance then
    self.hasReached = true
    Scene.fireEvent("reached_target", { entityId = self.entity.id })
    return
  end
  
  -- Normalize direction
  local dirX = dx / distance
  local dirY = dy / distance
  local dirZ = dz / distance
  
  -- Move toward target
  local deltaTime = dt / 1000
  local step = self.speed * deltaTime
  
  pos.x = pos.x + dirX * step
  pos.y = pos.y + dirY * step
  pos.z = pos.z + dirZ * step
  Transform.setPosition(self.entity, pos)
  
  -- Optionally rotate to face target
  Transform.lookAt(self.entity, target)
end

return schema
```

## Camera Scripts

### Simple Follow Camera

```lua
local schema = {
  properties = {
    targetEntityId = { type = "entity", required = true },
    offset = { type = "vec3", default = { 0, 5, 10 } }
  }
}

function lateUpdate(dt)
  local targetId = self.targetEntityId
  if not targetId or targetId == "" then return end
  
  local targetEntity = Scene.getEntity(targetId)
  if not targetEntity then return end
  
  local targetPos = Transform.getPosition(targetEntity)
  local offset = self.offset
  
  local cameraPos = {
    x = targetPos.x + offset[1],
    y = targetPos.y + offset[2],
    z = targetPos.z + offset[3]
  }
  
  Transform.setPosition(self.entity, cameraPos)
  Transform.lookAt(self.entity, targetPos)
end

return schema
```

### Smooth Follow Camera

```lua
local schema = {
  properties = {
    targetEntityId = { type = "entity", required = true },
    offset = { type = "vec3", default = { 0, 5, 10 } },
    smoothSpeed = { type = "number", default = 5.0 }
  }
}

function lateUpdate(dt)
  local targetId = self.targetEntityId
  if not targetId or targetId == "" then return end
  
  local targetEntity = Scene.getEntity(targetId)
  if not targetEntity then return end
  
  local targetPos = Transform.getPosition(targetEntity)
  local offset = self.offset
  
  -- Desired camera position
  local desiredPos = {
    x = targetPos.x + offset[1],
    y = targetPos.y + offset[2],
    z = targetPos.z + offset[3]
  }
  
  -- Current camera position
  local currentPos = Transform.getPosition(self.entity)
  
  -- Smooth interpolation (lerp)
  local t = math.min(1.0, self.smoothSpeed * (dt / 1000))
  local newPos = {
    x = currentPos.x + (desiredPos.x - currentPos.x) * t,
    y = currentPos.y + (desiredPos.y - currentPos.y) * t,
    z = currentPos.z + (desiredPos.z - currentPos.z) * t
  }
  
  Transform.setPosition(self.entity, newPos)
  Transform.lookAt(self.entity, targetPos)
end

return schema
```

### Mouse Look Camera

```lua
local schema = {
  properties = {
    sensitivity = { type = "number", default = 0.2 },
    invertY = { type = "boolean", default = false }
  }
}

function init()
  self.rotationX = 0
  self.rotationY = 0
end

function update(dt)
  local mouseDelta = Input.getMouseDelta()
  
  if mouseDelta.x ~= 0 or mouseDelta.y ~= 0 then
    -- Apply mouse delta to rotation
    self.rotationY = self.rotationY + mouseDelta.x * self.sensitivity
    self.rotationX = self.rotationX + mouseDelta.y * self.sensitivity * (self.invertY and -1 or 1)
    
    -- Clamp vertical rotation to prevent flipping
    self.rotationX = math.clamp(self.rotationX, -89, 89)
    
    -- Apply rotation to camera
    Transform.setRotation(self.entity, { 
      x = self.rotationX, 
      y = self.rotationY, 
      z = 0 
    })
  end
end

return schema
```

## Physics & Collision

### Apply Force on Collision

```lua
local schema = {
  properties = {
    bounceForce = { type = "number", default = 10.0 }
  }
}

function onCollision(other)
  log.info("Collision", "Hit: " .. other.id)
  
  -- Apply upward force on collision
  Physics.applyImpulse(self.entity, { x = 0, y = self.bounceForce, z = 0 })
end

return schema
```

### Trigger Zone

```lua
local schema = {
  properties = {
    eventName = { type = "string", default = "entered_zone" }
  }
}

function init()
  self.entitiesInside = {}
end

function onCollisionEnter(other)
  if not self.entitiesInside[other.id] then
    self.entitiesInside[other.id] = true
    
    log.info("TriggerZone", "Entity entered: " .. other.id)
    Scene.fireEvent(self.eventName, { 
      entityId = other.id,
      triggerId = self.entity.id
    })
  end
end

function onCollisionExit(other)
  if self.entitiesInside[other.id] then
    self.entitiesInside[other.id] = nil
    
    log.info("TriggerZone", "Entity exited: " .. other.id)
    Scene.fireEvent(self.eventName .. "_exit", { 
      entityId = other.id,
      triggerId = self.entity.id
    })
  end
end

return schema
```

### Raycast Ground Detection

```lua
local schema = {
  properties = {
    rayLength = { type = "number", default = 1.0 }
  }
}

function update(dt)
  local pos = Transform.getPosition(self.entity)
  
  -- Cast ray downward
  local hit = Physics.raycast({
    origin = { x = pos.x, y = pos.y, z = pos.z },
    direction = { x = 0, y = -1, z = 0 },
    maxDistance = self.rayLength
  })
  
  if hit then
    self.onGround = true
    self.groundHeight = hit.point.y
  else
    self.onGround = false
  end
end

return schema
```

## Input Handling

### Keyboard Action Mapping

```lua
local schema = {
  properties = {
    jumpKey = { type = "string", default = "space" },
    interactKey = { type = "string", default = "e" }
  }
}

function update(dt)
  -- Jump
  if Input.isKeyDown(self.jumpKey) then
    self:jump()
  end
  
  -- Interact
  if Input.isKeyDown(self.interactKey) then
    self:interact()
  end
end

function jump()
  log.info("Input", "Jump!")
  -- Jump logic
end

function interact()
  log.info("Input", "Interact!")
  -- Interaction logic
end

return schema
```

### Mouse Click Handler

```lua
local schema = {
  properties = {
    fireRate = { type = "number", default = 0.2 }
  }
}

function init()
  self.lastFireTime = 0
end

function update(dt)
  if Input.isMouseButtonPressed(0) then -- Left click
    local currentTime = Time.time()
    
    if currentTime - self.lastFireTime >= self.fireRate then
      self:fire()
      self.lastFireTime = currentTime
    end
  end
end

function fire()
  log.info("Weapon", "Fire!")
  Scene.fireEvent("weapon_fired", { entityId = self.entity.id })
  
  -- Raycast from camera to see what was hit
  local pos = Transform.getPosition(self.entity)
  local forward = Transform.getForward(self.entity)
  
  local hit = Physics.raycast({
    origin = pos,
    direction = forward,
    maxDistance = 100
  })
  
  if hit then
    log.info("Weapon", "Hit: " .. hit.entity.id)
    Scene.fireEvent("entity_hit", { 
      targetId = hit.entity.id,
      attackerId = self.entity.id
    })
  end
end

return schema
```

## Entity Interaction

### Find Nearest Entity

```lua
local schema = {
  properties = {
    searchRadius = { type = "number", default = 10.0 },
    targetTag = { type = "string", default = "enemy" }
  }
}

function update(dt)
  local myPos = Transform.getPosition(self.entity)
  local nearestEntity = nil
  local nearestDistance = math.huge
  
  -- Get all entities (Note: In a real game, you'd filter by tag)
  local allEntities = Scene.getAllEntities()
  
  for _, entity in ipairs(allEntities) do
    if entity.id ~= self.entity.id then
      local theirPos = Transform.getPosition(entity)
      local dx = theirPos.x - myPos.x
      local dy = theirPos.y - myPos.y
      local dz = theirPos.z - myPos.z
      local distance = math.sqrt(dx*dx + dy*dy + dz*dz)
      
      if distance <= self.searchRadius and distance < nearestDistance then
        nearestDistance = distance
        nearestEntity = entity
      end
    end
  end
  
  if nearestEntity then
    self.targetEntity = nearestEntity.id
    -- Face nearest enemy
    Transform.lookAt(self.entity, Transform.getPosition(nearestEntity))
  else
    self.targetEntity = nil
  end
end

return schema
```

### Cross-Script Communication

```lua
-- Script A: Shares data via properties
local schema = {
  properties = {
    currentSpeed = { type = "number", default = 0 }
  }
}

function update(dt)
  -- Update speed based on movement
  self.currentSpeed = 5.0
end

return schema
```

```lua
-- Script B: Reads data from Script A
local schema = {
  properties = {
    moveScriptName = { type = "string", default = "builtin://first_person_move.lua" }
  }
}

function update(dt)
  -- Read sibling script's property
  local speed = Scene.getScriptSlotProperty(
    self.entity.id,
    self.moveScriptName,
    "currentSpeed"
  )
  
  if speed and speed > 0 then
    log.info("SpeedMonitor", "Moving at: " .. speed)
  end
end

return schema
```

## Custom Events

### Event Publisher

```lua
local schema = {
  properties = {
    eventInterval = { type = "number", default = 1.0 }
  }
}

function init()
  self.timer = 0
end

function update(dt)
  self.timer = self.timer + (dt / 1000)
  
  if self.timer >= self.eventInterval then
    Scene.fireEvent("periodic_event", {
      timestamp = Time.time(),
      entityId = self.entity.id
    })
    self.timer = 0
  end
end

return schema
```

### Event Subscriber

```lua
function init()
  -- Subscribe to custom event
  Scene.onEvent(self, "periodic_event", function(data)
    log.info("EventListener", "Received event from: " .. data.entityId)
  end)
  
  -- Subscribe to system events
  Scene.onEvent(self, "entity_died", function(data)
    log.info("EventListener", "Entity died: " .. data.entityId)
  end)
end

return {}
```

## Debug Visualization

### Debug Gizmos

```lua
local schema = {
  properties = {
    showWaypoints = { type = "boolean", default = true },
    waypointColor = { type = "color", default = { r = 0, g = 1, b = 1 } }
  }
}

function onDrawGizmos(dt)
  if not self.showWaypoints then return end
  
  local pos = Transform.getPosition(self.entity)
  local forward = Transform.getForward(self.entity)
  
  -- Draw forward direction line
  local endPoint = {
    x = pos.x + forward.x * 2,
    y = pos.y + forward.y * 2,
    z = pos.z + forward.z * 2
  }
  
  Gizmo.drawLine(pos, endPoint, { r = 1, g = 0, b = 0 })
  
  -- Draw sphere at position
  Gizmo.drawSphere(pos, 0.5, self.waypointColor)
  
  -- Draw label
  Gizmo.drawLabel(pos, "Entity: " .. self.entity.id, { r = 1, g = 1, b = 1 })
end

return schema
```

## Complete API Reference

### Transform API

```lua
-- Position
Transform.getPosition(entity) --> { x, y, z }
Transform.setPosition(entity, { x, y, z })

-- Rotation (Euler angles in degrees)
Transform.getRotation(entity) --> { x, y, z }
Transform.setRotation(entity, { x, y, z })

-- Scale
Transform.getScale(entity) --> { x, y, z }
Transform.setScale(entity, { x, y, z })

-- Direction Vectors
Transform.getForward(entity) --> { x, y, z } -- -Z
Transform.getRight(entity)   --> { x, y, z } -- +X
Transform.getUp(entity)      --> { x, y, z } -- +Y

-- Look At
Transform.lookAt(entity, { x, y, z })
```

### Physics API

```lua
-- Forces
Physics.applyForce(entity, { x, y, z })
Physics.applyImpulse(entity, { x, y, z })

-- Velocity
Physics.setVelocity(entity, { x, y, z })
Physics.getVelocity(entity) --> { x, y, z }

-- Raycasting
local hit = Physics.raycast({
  origin = { x, y, z },
  direction = { x, y, z },
  maxDistance = 100
})

if hit then
  hit.entity     -- Entity that was hit
  hit.point      -- Hit position { x, y, z }
  hit.normal     -- Surface normal { x, y, z }
  hit.distance   -- Distance to hit
end
```

### Input API

```lua
-- Keyboard
Input.isKeyPressed(key)   -- Held down
Input.isKeyDown(key)      -- Just pressed
Input.isKeyReleased(key)  -- Just released

-- Mouse
Input.getMousePosition()  --> { x, y }
Input.getMouseDelta()     --> { x, y }
Input.isMouseButtonPressed(button)  -- 0=left, 1=right, 2=middle
Input.isMouseButtonDown(button)
Input.isMouseButtonReleased(button)

-- Gamepad
Input.isGamepadButtonPressed(index, button)
Input.getGamepadAxis(index, axis)
```

### Scene API

```lua
-- Events
Scene.fireEvent(eventName, data)
Scene.onEvent(self, eventName, callback)

-- Entity Management
Scene.getEntity(entityId) --> entity
Scene.getAllEntities()    --> array of entities

-- Components
Scene.addComponent(entityId, componentType, params)
Scene.removeComponent(entityId, componentType)
Scene.hasComponent(entityId, componentType) --> boolean
Scene.getComponentProperty(entityId, componentType, key) --> value
Scene.setComponentProperty(entityId, componentType, key, value)

-- Cross-Script Access
Scene.getScriptSlotNames(entityId) --> array of script IDs
Scene.getScriptSlotProperty(entityId, scriptId, key) --> value
Scene.setScriptSlotProperty(entityId, scriptId, key, value)
```

### Time API

```lua
Time.deltaTime()  --> milliseconds since last frame
Time.time()       --> total elapsed time
```

### Math API

```lua
-- Basic Math
math.lerp(a, b, t)         -- Linear interpolation
math.clamp(value, min, max)-- Clamp value

-- Vec3 Operations (via math.vec3)
math.vec3.add(v1, v2)
math.vec3.sub(v1, v2)
math.vec3.mul(v, scalar)
math.vec3.length(v)
math.vec3.normalize(v)
math.vec3.dot(v1, v2)
math.vec3.cross(v1, v2)
math.vec3.distance(v1, v2)
```

### Gizmo API (Debug)

```lua
-- Draw shapes (only visible in drawGizmos mode)
Gizmo.drawLine(start, end, color)
Gizmo.drawSphere(center, radius, color)
Gizmo.drawLabel(position, text, color)

-- Color format: { r = 1.0, g = 0.5, b = 0.0 }
```

### Log API

```lua
log.info(system, message, data)
log.warn(system, message, data)
log.error(system, message, data)
log.debug(system, message, data)

print(...) -- Simple console output
```

## Common Patterns

### State Machine

```lua
local schema = {
  properties = {
    initialState = { type = "string", default = "idle" }
  }
}

function init()
  self.state = self.initialState
  self.stateTimer = 0
end

function update(dt)
  self.stateTimer = self.stateTimer + (dt / 1000)
  
  if self.state == "idle" then
    self:updateIdle(dt)
  elseif self.state == "patrol" then
    self:updatePatrol(dt)
  elseif self.state == "chase" then
    self:updateChase(dt)
  end
end

function updateIdle(dt)
  if self.stateTimer > 2.0 then
    self:changeState("patrol")
  end
end

function updatePatrol(dt)
  -- Patrol logic
end

function updateChase(dt)
  -- Chase logic
end

function changeState(newState)
  log.info("StateMachine", "Changing state: " .. self.state .. " -> " .. newState)
  self.state = newState
  self.stateTimer = 0
end

return schema
```

### Delayed Action

```lua
function init()
  self.delayedActions = {}
end

function update(dt)
  local currentTime = Time.time()
  
  -- Process delayed actions
  for i = #self.delayedActions, 1, -1 do
    local action = self.delayedActions[i]
    if currentTime >= action.executeAt then
      action.callback()
      table.remove(self.delayedActions, i)
    end
  end
end

function delayAction(seconds, callback)
  table.insert(self.delayedActions, {
    executeAt = Time.time() + seconds,
    callback = callback
  })
end

-- Usage:
-- delayAction(2.0, function()
--   log.info("Delayed", "This runs after 2 seconds")
-- end)

return {}
```

### Object Pooling

```lua
local schema = {
  properties = {
    poolSize = { type = "number", default = 10 },
    prefabName = { type = "string", default = "Bullet" }
  }
}

function init()
  self.pool = {}
  self.activeObjects = {}
  
  -- Pre-create pool
  for i = 1, self.poolSize do
    local obj = Scene.createFromPrefab(self.prefabName)
    Scene.setEntityEnabled(obj.id, false)
    table.insert(self.pool, obj)
  end
end

function spawn(position)
  local obj = table.remove(self.pool)
  
  if not obj then
    log.warn("ObjectPool", "Pool exhausted!")
    return nil
  end
  
  Transform.setPosition(obj, position)
  Scene.setEntityEnabled(obj.id, true)
  table.insert(self.activeObjects, obj)
  
  return obj
end

function recycle(obj)
  Scene.setEntityEnabled(obj.id, false)
  
  -- Remove from active list
  for i, active in ipairs(self.activeObjects) do
    if active.id == obj.id then
      table.remove(self.activeObjects, i)
      break
    end
  end
  
  -- Return to pool
  table.insert(self.pool, obj)
end

return schema
```

## Troubleshooting

### Script Not Running

**Symptoms**: Hooks are not being called

**Solutions**:
1. Check that the script returns a schema table
2. Verify the script is attached to the entity
3. Check for Lua syntax errors in the console
4. Ensure the entity is enabled

### Properties Not Updating

**Symptoms**: Changes in the editor don't reflect in the script

**Solutions**:
1. Implement `onPropertyChanged(key, value)` hook
2. Use `self.properties.propertyName` to read
3. Check that properties are defined in the schema

### Collision Not Detected

**Symptoms**: `onCollision` hook not called

**Solutions**:
1. Ensure entity has `RigidBodyComponent` and `ColliderComponent`
2. Check that both entities in the collision have colliders
3. Verify collision layers/masks are compatible

### Performance Issues

**Symptoms**: Low FPS, stuttering

**Solutions**:
1. Avoid expensive operations in `update()`
2. Cache entity lookups in `init()` instead of searching every frame
3. Use events instead of polling
4. Minimize raycast calls
5. Check for infinite loops

### Entity Not Found

**Symptoms**: `Scene.getEntity()` returns `nil`

**Solutions**:
1. Verify entity ID is correct
2. Check that entity exists in the scene
3. Ensure entity wasn't destroyed

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [ECS System](./ECS.md)
- [Lua Scripting System](./SCRIPTING.md)
- [System Flows & Diagrams](./FLOWS.md)
