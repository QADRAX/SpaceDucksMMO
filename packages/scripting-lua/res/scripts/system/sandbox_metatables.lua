-- Lua metatable definitions for the scripting sandbox.
-- Defines __SelfMT and the properties dirty-tracking proxy.
-- The `self` table exposed to user scripts provides:
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
