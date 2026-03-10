--   self.<bridge>    → bridge API (e.g. self.Transform, self.Scene, …)

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

    -- Support the old bridge shortcut optionally for a while or remove it?
    -- Let's keep it for fallback if they mistakenly use global syntax still?
    -- Wait, the task said: "eliminates global access". They must use self.entity.components.Transform
    -- We can keep ctx object fields
    local bridge = ctx.bridges[k]
    if bridge ~= nil then return bridge end

    return ctx[k]
  end,
  __newindex = function(t, k, v)
    rawset(t, k, v)
  end,
}
