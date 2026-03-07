/**
 * Lua metatable definitions for the scripting sandbox.
 *
 * Defines __SelfMT, __EntityMT, __ComponentMT, __ScriptsProxyMT,
 * and __ScriptSlotMT. These metatables compose the `self` proxy
 * chain that scripts interact with.
 */
export const SANDBOX_METATABLES_LUA = `
-- Slot contexts: slotKey → { id, slotId, state, properties, bridges }
__Contexts = {}
-- Slot hooks: slotKey → { init, update, ... }
__SlotHooks = {}

-- Self metatable: resolves bridges and properties
__SelfMT = {
  __index = function(t, k)
    local ctx = __Contexts[rawget(t, '__slotKey')]
    if not ctx then return nil end

    -- Direct bridge access (e.g. self.transform)
    local bridge = ctx.bridges[k]
    if bridge then return bridge end

    -- Fallback to entity metatable
    return __EntityMT.__index(t, k)
  end,
}

-- Entity metatable: provides transform/component shortcuts
__EntityMT = {
  __index = function(t, k)
    local ctx = __Contexts[rawget(t, '__slotKey')]
    if not ctx then return nil end

    -- Transform shortcuts
    local transformBridge = ctx.bridges['Transform']
    if transformBridge and transformBridge[k] then
      return transformBridge[k]
    end

    return nil
  end,
}
`;
