// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.

export const BuiltInScripts: Record<string, string> = {
  "builtin://move_to_point.lua": `-- =======================================================================
-- move_to_point.lua (V2)
-- Moves the entity to a target point over a fixed duration using easing.
-- =======================================================================

---@class MoveToPointPropsV2
---@field targetPoint Vec3V2|table Destination world coordinate.
---@field duration? number Travel time in seconds. Default: 2.0.
---@field easing? string Easing curve name. Default: "cubicInOut".
---@field delay? number Delay in seconds before starting movement. Default: 0.

---@class MoveToPointStateV2
---@field startPos Vec3V2 Starting position before movement.
---@field elapsed number Elapsed time since movement start.
---@field active boolean Whether the movement is currently active.

---@class MoveToPointScript : ScriptInstanceV2
---@field properties MoveToPointPropsV2
---@field state MoveToPointStateV2
local MoveToPoint = {
    schema = {
        name = "Move to Point (V2)",
        description = "Interpolates position towards a target point.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "Destination point." },
            duration    = { type = "number", default = 2.0, description = "Duration in seconds." },
            easing      = { type = "string", default = "cubicInOut", description = "Easing name." },
            delay       = { type = "number", default = 0, description = "Initial delay." }
        }
    }
}

function MoveToPoint:init()
    self.state = {
        startPos = self.entity.components.transform.getLocalPosition(),
        elapsed  = 0,
        active   = true
    }
end

--- Restart if target changes
--- @param _dt number (unused, 0 for property changes)
--- @param key string Property key that changed
--- @param value any New value
function MoveToPoint:onPropertyChanged(_dt, key, value)
    if key == "targetPoint" then
        self.state.startPos = self.entity.components.transform.getLocalPosition()
        self.state.elapsed  = 0
        self.state.active   = true
    end
end

function MoveToPoint:update(dt)
    if not self.state.active then return end

    local props   = self.properties
    local target  = props.targetPoint
    if not target then return end
    local state   = self.state
    local secs    = dt
    state.elapsed = state.elapsed + secs

    local delay   = props.delay or 0
    if state.elapsed < delay then return end

    local t = (state.elapsed - delay) / math.max(0.001, props.duration)
    if t >= 1 then
        t = 1
        state.active = false
    end

    local easedFn = math.ext.easing[props.easing] or math.ext.easing.linear
    local easedT  = easedFn(t)
    local start   = state.startPos

    -- Interpolate
    local nx      = math.ext.lerp(start.x, target.x, easedT)
    local ny      = math.ext.lerp(start.y, target.y, easedT)
    local nz      = math.ext.lerp(start.z, target.z, easedT)
    self.entity.components.transform.setPosition(math.vec3.new(nx, ny, nz))
end

return MoveToPoint
`,
  "builtin://waypoint_path.lua": `-- =======================================================================
-- waypoint_path.lua (V2)
-- Follows a list of waypoint entities by driving a sibling move_to_point script.
-- =======================================================================

---@class WaypointPathPropsV2
---@field speed? number Movement speed in units/sec. Default: 3.
---@field loop? boolean If true, loops back to first waypoint. Default: true.
---@field waypoints? EntityWrapperV2[] Ordered list of waypoint entities.
---@field easing? string Easing curve forwarded to MoveToPoint. Default: "cubicInOut".
---@field arrivalThreshold? number Distance at which the waypoint is considered reached. Default: 0.15.

---@class WaypointPathStateV2
---@field index number Current target waypoint index (1-based).
---@field waiting boolean True when waiting for MoveToPoint to reach target.

---@class WaypointPathScript : ScriptInstanceV2
---@field properties WaypointPathPropsV2
---@field state WaypointPathStateV2
local WaypointPath = {
    schema = {
        name = "Waypoint Path (V2)",
        description = "Sequences movement through entity waypoints.",
        properties = {
            speed            = { type = "number", default = 3, description = "Units per second." },
            loop             = { type = "boolean", default = true, description = "Loop back to start." },
            waypoints        = { type = "entityRefArray", default = {}, description = "Entities to follow." },
            easing           = { type = "string", default = "cubicInOut", description = "Forwarded easing." },
            arrivalThreshold = { type = "number", default = 0.2, description = "Distance threshold." }
        }
    }
}

function WaypointPath:init()
    self.state = {
        index   = 1,
        waiting = false
    }
end

function WaypointPath:update(dt)
    local waypoints = self.references.waypoints
    if not waypoints or #waypoints == 0 then return end

    local state = self.state
    local targetEntity = waypoints[state.index]
    if not targetEntity then return end

    -- Check if we arrived at target
    -- Note: Waypoint Path uses WORLD position for distance check because waypoints might be parented elsewhere
    local posRaw = self.entity.components.transform.getPosition()
    local targetRaw = targetEntity.components.transform.getPosition()
    
    local pos = math.vec3.new(posRaw.x, posRaw.y, posRaw.z)
    local target = math.vec3.new(targetRaw.x, targetRaw.y, targetRaw.z)
    local dist = pos:distanceTo(target)

    local props  = self.properties

    if dist < (props.arrivalThreshold or 0.2) then
        -- Arrived! Advance index
        local nextIdx = state.index + 1
        if nextIdx > #waypoints then
            if props.loop then
                nextIdx = 1
            else
                return     -- finished
            end
        end
        state.index   = nextIdx
        state.waiting = false
        -- Re-fetch targetEntity for the new index before driving MoveToPoint
        targetEntity = waypoints[state.index]
        if not targetEntity then return end
        targetRaw = targetEntity.components.transform.getPosition()
        target = math.vec3.new(targetRaw.x, targetRaw.y, targetRaw.z)
        dist = pos:distanceTo(target)
    end

    -- Drive sibling move_to_point if not already moving towards CURRENT target
    if not state.waiting then
        -- We just changed target or just started
        local duration = dist / math.max(0.1, props.speed)

        -- Drive the sibling script
        -- IMPORTANT: MoveToPoint expects LOCAL coordinates if it's going to use setPosition
        -- However, Built-in scripts often assume they are at root OR they target world coords.
        -- If mover is not at root, we'd need to convert world target to local target.
        -- For simplicity, let's assume mover is at root for now or MoveToPoint handles world? 
        -- No, MoveToPoint uses setPosition (local).
        
        -- Logic: If we want to reach a world point via local movement:
        -- localTarget = moverParentInv * worldTarget
        
        -- For built-in simplicity, let's assume world==local for now or add a setWorldPosition bridge.
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "targetPoint", target)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "duration", duration)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "easing",
            props.easing or "cubicInOut")

        state.waiting = true
    end
end

return WaypointPath
`,
};

export const TestScripts: Record<string, string> = {
  "test://minimal_engine_ports.lua": `-- Minimal test: init calls engine_ports (custom port).
-- Isolates: engine_ports injection, port resolution.
-- Verification: properties.greeting set from port.hello() result.
return {
    init = function(self)
        local portKey = self.properties.portKey or "io:test-custom"
        local port = engine_ports and engine_ports[portKey]
        if port and port.hello then
            self.properties.greeting = port.hello("Test")
        else
            self.properties.greeting = "no-port"
        end
    end
}
`,
  "test://minimal_init.lua": `-- Minimal test: init only, no bridges, no self.entity.
-- Isolates: slot creation, __LoadSlot, __WrapSelf, init hook.
-- Verification: properties.initCalled = true (readable from ECS snapshot).
return {
    init = function(self)
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_properties.lua": `-- Minimal test: init writes to self.properties.
-- Isolates: properties proxy, dirty tracking, flush to ECS.
return {
    init = function(self)
        self.properties.foo = "bar"
    end
}
`,
  "test://minimal_transform.lua": `-- Minimal test: init calls self.entity.components.transform.getLocalPosition().
-- Isolates: entity proxy, components proxy, transform bridge.
-- Verification: properties.initCalled = true, properties.startX/Y/Z from position.
return {
    init = function(self)
        local pos = self.entity.components.transform.getLocalPosition()
        self.properties.startX = pos.x
        self.properties.startY = pos.y
        self.properties.startZ = pos.z
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_transform_global.lua": `-- Minimal test: init calls self.Transform.getLocalPosition() (bridge shortcut).
-- Uses self.Transform instead of self.entity.components.transform — same scoped bridge.
return {
    init = function(self)
        local pos = self.Transform and self.Transform.getLocalPosition()
        if pos then
            self.properties.startX = pos.x
            self.properties.startY = pos.y
            self.properties.startZ = pos.z
        end
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_update.lua": `-- Minimal test: update hook only, no bridges.
-- Isolates: runFrameHooks, update pipeline, dt passing.
-- Verification: properties.updateCount incremented each frame.
return {
    init = function(self)
        self.properties.updateCount = 0
    end,
    update = function(self, dt)
        self.properties.updateCount = (self.properties.updateCount or 0) + 1
    end
}
`,
};

export const SystemScripts: Record<string, string> = {
  "math_ext": `-- Lua math extensions for the scripting sandbox.
-- Provides vec3 as a callable table with operator overloading + static helpers,
-- and math.ext utilities (lerp, clamp, easing functions, etc.).
---@diagnostic disable: duplicate-set-field


--- Vec3 metatable with arithmetic operators and methods.
local Vec3MT = {}
Vec3MT.__index = Vec3MT

function Vec3MT:length()
  return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)
end

function Vec3MT:normalize()
  local len = self:length()
  if len == 0 then return math3.vec3(0, 0, 0) end
  return math3.vec3(self.x / len, self.y / len, self.z / len)
end

function Vec3MT:dot(other)
  return self.x * other.x + self.y * other.y + self.z * other.z
end

function Vec3MT:cross(other)
  return math3.vec3(
    self.y * other.z - self.z * other.y,
    self.z * other.x - self.x * other.z,
    self.x * other.y - self.y * other.x
  )
end

function Vec3MT:distanceTo(other)
  local dx = self.x - other.x
  local dy = self.y - other.y
  local dz = self.z - other.z
  return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Vec3MT:clone()
  return math3.vec3(self.x, self.y, self.z)
end

function Vec3MT:lerp(other, t)
  return math3.vec3(
    self.x + (other.x - self.x) * t,
    self.y + (other.y - self.y) * t,
    self.z + (other.z - self.z) * t
  )
end

function Vec3MT:toArray()
  return { self.x, self.y, self.z }
end

Vec3MT.__add      = function(a, b) return math3.vec3(a.x + b.x, a.y + b.y, a.z + b.z) end
Vec3MT.__sub      = function(a, b) return math3.vec3(a.x - b.x, a.y - b.y, a.z - b.z) end
Vec3MT.__mul      = function(a, b)
  if type(a) == "number" then return math3.vec3(a * b.x, a * b.y, a * b.z) end
  if type(b) == "number" then return math3.vec3(a.x * b, a.y * b, a.z * b) end
  return math3.vec3(a.x * b.x, a.y * b.y, a.z * b.z)
end
Vec3MT.__unm      = function(a) return math3.vec3(-a.x, -a.y, -a.z) end
Vec3MT.__eq       = function(a, b) return a.x == b.x and a.y == b.y and a.z == b.z end
Vec3MT.__tostring = function(v)
  return string.format("vec3(%.4f, %.4f, %.4f)", v.x, v.y, v.z)
end

--- Internal constructor: creates a Vec3 instance.
local function newVec3(x, y, z)
  return setmetatable({ x = x or 0, y = y or 0, z = z or 0 }, Vec3MT)
end

--- Expose math.vec3 as a callable table so we can attach static helpers.
--- Scripts call \`math.vec3(x, y, z)\` via __call, and access statics like
--- \`math.vec3.zero()\` as regular table fields.
math3 = {
  vec3 = setmetatable({
    -- Static constructors
    new     = newVec3,
    zero    = function() return newVec3(0, 0, 0) end,
    one     = function() return newVec3(1, 1, 1) end,
    up      = function() return newVec3(0, 1, 0) end,
    forward = function() return newVec3(0, 0, -1) end,
    right   = function() return newVec3(1, 0, 0) end,
  }, {
    -- Calling math.vec3(x, y, z) creates a new Vec3
    __call = function(_, x, y, z) return newVec3(x, y, z) end,
  }),
}

-- Also alias on math table for backward compat (math.vec3 = math3.vec3)
math.vec3 = math3.vec3

--- Math extensions.
math.ext = {}

function math.ext.lerp(a, b, t) return a + (b - a) * t end

function math.ext.clamp(v, lo, hi) return math.max(lo, math.min(hi, v)) end

function math.ext.inverseLerp(a, b, v) return (v - a) / (b - a) end

function math.ext.sign(x) return x > 0 and 1 or (x < 0 and -1 or 0) end

function math.ext.remap(iLo, iHi, oLo, oHi, v)
  local t = math.ext.inverseLerp(iLo, iHi, v)
  return math.ext.lerp(oLo, oHi, t)
end

function math.ext.moveTowards(current, target, maxDelta)
  local diff = target - current
  if math.abs(diff) <= maxDelta then return target end
  return current + math.ext.sign(diff) * maxDelta
end

--- Easing functions.
math.ext.easing = {}

--- Generic easing helper.
--- @param name string  Easing function name (e.g. "cubicInOut").
--- @param t number     Normalized time [0, 1].
--- @return number      Eased value.
function math.ext.ease(name, t)
  local fn = math.ext.easing[name]
  if not fn then
    -- Fallback to linear if easing function not found
    return t
  end
  return fn(t)
end

function math.ext.easing.linear(t) return t end

function math.ext.easing.smoothstep(t) return t * t * (3 - 2 * t) end

function math.ext.easing.quadIn(t) return t * t end

function math.ext.easing.quadOut(t) return t * (2 - t) end

function math.ext.easing.cubicIn(t) return t * t * t end

function math.ext.easing.cubicOut(t)
  local u = 1 - t; return 1 - u * u * u
end

function math.ext.easing.sineIn(t) return 1 - math.cos(t * math.pi / 2) end

function math.ext.easing.sineOut(t) return math.sin(t * math.pi / 2) end

function math.ext.easing.sineInOut(t)
  return -(math.cos(math.pi * t) - 1) / 2
end

function math.ext.easing.cubicInOut(t)
  if t < 0.5 then
    return 4 * t * t * t
  else
    local f = ((2 * t) - 2)
    return 0.5 * f * f * f + 1
  end
end

function math.ext.easing.bounceOut(t)
  local n1 = 7.5625
  local d1 = 2.75

  if t < 1 / d1 then
    return n1 * t * t
  elseif t < 2 / d1 then
    t = t - 1.5 / d1
    return n1 * t * t + 0.75
  elseif t < 2.5 / d1 then
    t = t - 2.25 / d1
    return n1 * t * t + 0.9375
  else
    t = t - 2.625 / d1
    return n1 * t * t + 0.984375
  end
end
`,
  "sandbox_metatables": `--   self.<bridge>    → bridge API (e.g. self.Transform, self.Scene, …)

---@diagnostic disable: undefined-global
---@diagnostic disable: lowercase-global

-- Slot contexts keyed by slotKey → { id, self, bridges }
__Contexts = {}
-- Slot hooks keyed by slotKey → { init = fn, update = fn, ... }
__SlotHooks = {}
-- Dirty property keys keyed by slotKey → { key = true, ... }
__DirtyProperties = {}

-- Properties proxy metatable.
-- Forwards reads straight to the underlying raw table.
-- Tracks any write as a dirty key so TypeScript can flush it back to ECS.
__PropertiesMT = {
  __index = function(t, k)
    return rawget(t, '__raw')[k]
  end,
  __newindex = function(t, k, v)
    rawget(t, '__raw')[k] = v
    local slotKey = rawget(t, '__slotKey')
    if slotKey then
      if not __DirtyProperties[slotKey] then
        __DirtyProperties[slotKey] = {}
      end
      __DirtyProperties[slotKey][k] = v
    end
  end,
}

--- Creates a new properties proxy for a slot.
--- @param slotKey string
--- @param rawProps table  Raw properties table (ECS-synced values)
--- @return table  Proxy table; reads come from rawProps, writes mark dirty
function __MakePropertiesProxy(slotKey, rawProps)
  local proxy = {}
  rawset(proxy, '__raw', rawProps)
  rawset(proxy, '__slotKey', slotKey)
  setmetatable(proxy, __PropertiesMT)
  return proxy
end

__EntityComponentsMT = {
  __index = function(t, k)
    -- Normalize the key to match injected TypeScript bridge names (e.g. 'transform' -> 'Transform')
    local bridgeName = k:gsub("^%l", string.upper)
    if k == "script" then
      bridgeName = "Script" 
    end

    local slotKey = rawget(t, '__slotKey')
    local ctx = __Contexts[slotKey]
    if not ctx then return nil end
    
    local entityId = rawget(t, '__entityId')
    local cachedBridges = rawget(t, '__cachedBridges')
    if cachedBridges[bridgeName] then return cachedBridges[bridgeName] end

    local bridge = ctx.bridges[bridgeName]
    if not bridge then
      -- Fallback: Create a generic proxy that delegates to host generic getters/setters
      local genericProxy = {}
      setmetatable(genericProxy, {
        __index = function(_, propName)
          return __GetResourceProperty(entityId, k, propName)
        end,
        __newindex = function(_, propName, propValue)
          __SetResourceProperty(entityId, k, propName, propValue)
        end
      })
      cachedBridges[bridgeName] = genericProxy
      return genericProxy
    end

    -- Return scoped bridge from TypeScript (no Lua proxy). pairs(bridge) + Lua wrappers
    -- triggers wasmoon "Cannot read properties of null (reading 'then')" when crossing Lua↔JS.
    if ctx.getScopedBridge then
      local scoped = ctx.getScopedBridge(slotKey, tostring(entityId), bridgeName)
      if scoped then
        cachedBridges[bridgeName] = scoped
        return scoped
      end
    end

    -- Fallback: build proxy in Lua (may fail for some bridges)
    local bridgeProxy = {}
    for funcName, fn in pairs(bridge) do
      if type(fn) == "function" then
        bridgeProxy[funcName] = function(...)
          return fn(entityId, ...)
        end
      end
    end
    cachedBridges[bridgeName] = bridgeProxy
    return bridgeProxy
  end
}

__EntityMT = {
  __index = function(t, k)
    if k == 'id' then return rawget(t, '__id') end
    if k == 'components' then
      local proxy = rawget(t, '__componentsProxy')
      if not proxy then
        proxy = {
          __entityId = rawget(t, '__id'),
          __slotKey = rawget(t, '__slotKey'),
          __cachedBridges = {}
        }
        setmetatable(proxy, __EntityComponentsMT)
        rawset(t, '__componentsProxy', proxy)
      end
      return proxy
    end
    return nil
  end
}

function __WrapEntity(slotKey, entityId)
  local e = { __id = entityId, __slotKey = slotKey }
  setmetatable(e, __EntityMT)
  return e
end

__ReferencesMT = {
  __index = function(t, k)
    local ctx = __Contexts[rawget(t, '__slotKey')]
    if not ctx then return nil end
    
    local val = rawget(ctx.properties, '__raw')[k]
    if val == nil then return nil end
    
    local schemaType = ctx.schemaTypes[k]
    if not schemaType then return val end
    
    if schemaType == "entityRef" or schemaType == "prefabRef" then
      return __WrapEntity(rawget(t, '__slotKey'), val)
    elseif schemaType == "entityRefArray" then
      local arr = {}
      for i, id in ipairs(val) do
        arr[i] = __WrapEntity(rawget(t, '__slotKey'), id)
      end
      return arr
    elseif schemaType == "entityComponentRef" then
      local compType = ctx.schemaComponentTypes[k]
      local e = __WrapEntity(rawget(t, '__slotKey'), val)
      return e.components[compType]
    elseif schemaType == "entityComponentRefArray" then
      local compType = ctx.schemaComponentTypes[k]
      local arr = {}
      for i, id in ipairs(val) do
         local e = __WrapEntity(rawget(t, '__slotKey'), id)
         arr[i] = e.components[compType]
      end
      return arr
    end
    
    return val
  end
}

-- Self metatable: gives access to entity wrapper, references proxy, and context fields
__SelfMT = {
  __index = function(t, k)
    local slotKey = rawget(t, '__slotKey')
    local ctx = __Contexts[slotKey]
    if not ctx then return nil end

    if k == 'entity' then
      local ent = rawget(t, '__entityProxy')
      if not ent then
        ent = __WrapEntity(slotKey, ctx.id)
        rawset(t, '__entityProxy', ent)
      end
      return ent
    elseif k == 'references' then
      local refs = rawget(t, '__referencesProxy')
      if not refs then
        refs = { __slotKey = slotKey }
        setmetatable(refs, __ReferencesMT)
        rawset(t, '__referencesProxy', refs)
      end
      return refs
    end

    -- Bridge shortcuts (self.Transform, self.Scene, etc.) — use scoped bridge when available.
    -- Only call getScopedBridge for bridge names; returning null from JS can trigger wasmoon errors.
    local bridge = ctx.bridges[k]
    if bridge ~= nil and ctx.getScopedBridge then
      local scoped = ctx.getScopedBridge(slotKey, ctx.id, k)
      if scoped then return scoped end
    end
    if bridge ~= nil then return bridge end

    return ctx[k]
  end,
  __newindex = function(t, k, v)
    rawset(t, k, v)
  end,
}
`,
  "sandbox_runtime": `-- Lua sandbox runtime helpers.
-- Defines: __WrapSelf, __CallHook, __UpdateProperty,
--          __FlushDirtyProperties, __DestroySlot, __LoadSlot.
-- These are the core runtime functions called from TypeScript.

--- Creates a self proxy for a script slot.
--- @param slotKey string  Unique slot identifier (entityId::scriptId)
--- @param id string       Entity ID
--- @param rawProps table  Raw properties table (values synced from ECS)
--- @param bridges table   Bridge API table (name → api object)
--- @param schemaTypes table?  Map of property keys to schema type strings
--- @param schemaComponentTypes table? Map of property keys to component type strings
--- @param getScopedBridge function? (slotKey, entityId, bridgeName) -> scoped bridge (JS object)
--- @return table  self proxy
function __WrapSelf(slotKey, id, rawProps, bridges, schemaTypes, schemaComponentTypes, getScopedBridge)
  local ctx = {
    id = id,
    state = {},
    properties = __MakePropertiesProxy(slotKey, rawProps),
    bridges = bridges or {},
    schemaTypes = schemaTypes or {},
    schemaComponentTypes = schemaComponentTypes or {},
    getScopedBridge = getScopedBridge or nil,
  }
  __Contexts[slotKey] = ctx

  local self = {}
  rawset(self, '__slotKey', slotKey)
  setmetatable(self, __SelfMT)

  ctx.self = self
  return self
end

--- Loads a user script, extracts its lifecycle hooks, and registers them.
---
--- Supports two hook declaration styles:
---   1. Return table:   \`return { init = function(self) ... end }\`
---   2. Top-level fns:  \`function init(self) ... end\`
---
--- Hooks are stored in \`__SlotHooks[slotKey]\`.
--- Globals declared by the script in style 2 are removed after capture.
---
--- @param slotKey string  Slot identifier
--- @param source string   Raw Lua source of the user script
--- @return boolean  true on success, false on compile/runtime error
function __LoadSlot(slotKey, source)
  local hookNames = {
    "init", "onEnable", "earlyUpdate", "update", "lateUpdate",
    "onDrawGizmos", "onCollisionEnter", "onCollisionExit",
    "onPropertyChanged", "onDisable", "onDestroy"
  }

  local fn, loadErr = load(source, "@" .. tostring(slotKey))
  if not fn then
    print("[ScriptError] Compile error in '" .. tostring(slotKey) .. "': " .. tostring(loadErr))
    return false
  end

  local ok, result = pcall(fn)
  if not ok then
    print("[ScriptError] Runtime error in '" .. tostring(slotKey) .. "': " .. tostring(result))
    return false
  end

  local hooks = {}
  if type(result) == "table" then
    -- Style 1: script returned { init = fn, update = fn, ... }
    for _, name in ipairs(hookNames) do
      if type(result[name]) == "function" then
        hooks[name] = result[name]
      end
    end
  else
    -- Style 2: script defined top-level named functions
    for _, name in ipairs(hookNames) do
      local g = _G[name]
      if type(g) == "function" then
        hooks[name] = g
        _G[name] = nil -- clean up to avoid polluting global namespace
      end
    end
  end

  __SlotHooks[slotKey] = hooks
  return true
end

--- Calls a lifecycle hook on a slot.
--- Returns true on success or if hook is not declared; false on Lua error.
--- @param slotKey string
--- @param hookName string
--- @param dt number
--- @return boolean
function __CallHook(slotKey, hookName, dt, ...)
  local hooks = __SlotHooks[slotKey]
  if not hooks then return true end

  local fn = hooks[hookName]
  if not fn then return true end

  local ctx = __Contexts[slotKey]
  if not ctx then return false end

  local ok, errMsg = pcall(fn, ctx.self, dt, ...)
  if not ok then
    print("[ScriptError] " .. tostring(slotKey) .. ":" .. hookName .. " — " .. tostring(errMsg))
    return false
  end
  return true
end

--- Pushes a single updated property into a slot.
--- Writes directly to the raw table, bypassing dirty tracking (ECS → Lua direction).
--- @param slotKey string
--- @param key string
--- @param value any
function __UpdateProperty(slotKey, key, value)
  local ctx = __Contexts[slotKey]
  if not ctx then return end
  rawget(ctx.properties, '__raw')[key] = value
end

--- Returns and clears the dirty property keys for a slot.
--- @param slotKey string
--- @return table|nil  { key = true, … } or nil if nothing is dirty
function __FlushDirtyProperties(slotKey)
  local dirty = __DirtyProperties[slotKey]
  __DirtyProperties[slotKey] = nil
  return dirty
end

--- Destroys a slot's context, hooks and dirty state.
--- @param slotKey string
function __DestroySlot(slotKey)
  __Contexts[slotKey] = nil
  __SlotHooks[slotKey] = nil
  __DirtyProperties[slotKey] = nil
end
`,
  "sandbox_security": `-- Lua sandbox security module.
-- Removes dangerous globals (os, io, debug, loadfile, dofile, etc.)
-- to prevent scripts from accessing the host filesystem or process.
--
-- NOTE: rawget / rawset / rawequal / rawlen are intentionally KEPT.
-- They are used in the scripting runtime's metatable infrastructure
-- (property proxy, __SelfMT, etc.) and are not dangerous in this context.

os = nil
io = nil
debug = nil
loadfile = nil
dofile = nil
collectgarbage = nil
`,
};
