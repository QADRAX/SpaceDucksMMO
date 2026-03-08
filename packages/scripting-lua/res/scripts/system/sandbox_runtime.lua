-- Lua sandbox runtime helpers.
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
---   1. Return table:   `return { init = function(self) ... end }`
---   2. Top-level fns:  `function init(self) ... end`
---
--- Hooks are stored in `__SlotHooks[slotKey]`.
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
