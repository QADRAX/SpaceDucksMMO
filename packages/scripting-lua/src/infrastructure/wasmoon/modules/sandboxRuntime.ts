/**
 * Lua runtime helpers for the scripting sandbox.
 *
 * Defines __WrapSelf, __CallHook, __UpdateProperty, __WrapValue.
 * These are the core runtime functions that the TypeScript sandbox
 * calls into Lua.
 */
export const SANDBOX_RUNTIME_LUA = `
--- Wraps a JS context into a Lua self table with metatables.
--- @param slotKey string
--- @param id string
--- @param properties table
--- @return table
function __WrapSelf(slotKey, id, properties)
  local self = {
    id = id,
    __slotKey = slotKey,
    state = {},
    properties = properties or {},
  }
  setmetatable(self, __SelfMT)
  return self
end

--- Calls a lifecycle hook on a slot.
--- Returns true on success, false on error.
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
    print("[ScriptError] " .. slotKey .. ":" .. hookName .. " — " .. tostring(errMsg))
    return false
  end
  return true
end

--- Updates a single property on a slot's self.
--- @param slotKey string
--- @param key string
--- @param value any
function __UpdateProperty(slotKey, key, value)
  local ctx = __Contexts[slotKey]
  if not ctx then return end
  ctx.self.properties[key] = value
end
`;
