// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.

export const BuiltInScripts: Record<string, string> = {
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
`,
  "sandbox_metatables": `-- Lua metatable definitions for the scripting sandbox.
-- Defines __SelfMT and the properties dirty-tracking proxy.
-- The \`self\` table exposed to user scripts provides:
--   self.id          → entity ID string
--   self.state       → persistent per-instance state table
--   self.properties  → ECS-synced properties (writes tracked as dirty)
--   self.<bridge>    → bridge API (e.g. self.Transform, self.Scene, …)

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

-- Self metatable: resolves bridge APIs and falls back to context fields.
__SelfMT = {
  __index = function(t, k)
    local ctx = __Contexts[rawget(t, '__slotKey')]
    if not ctx then return nil end

    -- Bridge shortcut: self.Transform, self.Scene, self.Input, …
    local bridge = ctx.bridges[k]
    if bridge ~= nil then return bridge end

    -- Context fields: self.id, self.state, self.properties
    return ctx[k]
  end,
  __newindex = function(t, k, v)
    -- Allow scripts to write to the self table freely (e.g. state mutation);
    -- direct self.properties assignments are handled by the properties proxy.
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
--- @return table  self proxy
function __WrapSelf(slotKey, id, rawProps, bridges)
  local ctx = {
    id = id,
    state = {},
    properties = __MakePropertiesProxy(slotKey, rawProps),
    bridges = bridges or {},
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
