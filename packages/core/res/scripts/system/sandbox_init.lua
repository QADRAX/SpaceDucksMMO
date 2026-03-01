-- ═══════════════════════════════════════════════════════════════════════
-- Sandbox Initialization Script
-- ═══════════════════════════════════════════════════════════════════════

-- Secure environment by clearing sensitive globals
os = nil
io = nil
debug = nil
loadfile = nil
dofile = nil

-- Script Reference Constants and Helpers
Script = {
    -- Built-in Scripts (Core)
    FirstPersonMove        = "builtin://first_person_move.lua",
    FirstPersonPhysicsMove = "builtin://first_person_physics_move.lua",
    FollowEntity           = "builtin://follow_entity.lua",
    FollowEntityPhysics    = "builtin://follow_entity_physics.lua",
    LookAtEntity           = "builtin://look_at_entity.lua",
    LookAtPoint            = "builtin://look_at_point.lua",
    MouseLook              = "builtin://mouse_look.lua",
    MoveToPoint            = "builtin://move_to_point.lua",
    OrbitCamera            = "builtin://orbit_camera.lua",
    SmoothFollow           = "builtin://smooth_follow.lua",
    SmoothLookAt           = "builtin://smooth_look_at.lua",

    -- Helpers for custom script paths
    editor                 = function(name) return "editor://" .. name .. ".lua" end,
    project                = function(name) return "project://" .. name .. ".lua" end
}


-- ── Vec3 Auto-Wrapping ──────────────────────────────────────────────
-- Converts plain {x,y,z} tables/userdata returned by TS bridges into
-- proper Vec3 objects with metatables (operators, :clone(), :length(), etc.).
-- Safe to call on any value — non-vec3 values pass through unchanged.
-- NOTE: math.vec3 is resolved at call-time (defined later by math_ext.lua),
-- so this function must only be called during script hooks, never at load time.
local function __WrapVec3(val)
    if val ~= nil and type(val) ~= "number" and type(val) ~= "string"
       and type(val) ~= "boolean" and type(val) ~= "function" then
        local x, y, z = val.x, val.y, val.z
        if x ~= nil and y ~= nil and z ~= nil then
            return math.vec3(x, y, z)
        end
    end
    return val
end

__SelfMT = {
    __index = function(t, k)
        -- Reserved names that shouldn't fallback to JS or component/entity lookup
        if k == "properties" or k == "id" or k == "slotId" or k == "state" then
            return rawget(t, k)
        end

        -- Prioritize JS properties (auto-wrap vec3-like values from JS context)
        local jsCtx = rawget(t, "__jsCtx")
        local val = jsCtx and jsCtx[k]
        if val ~= nil then return __WrapVec3(val) end

        -- Fallback to Entity behavior (transform helpers, etc.)
        return __EntityMT.__index(t, k)
    end,


    __newindex = function(t, k, v)
        t.__jsCtx[k] = v
    end
}


local function __WrapValue(val, propDef)
    if not propDef then return val end
    if propDef.type == "entity" and type(val) == "string" and val ~= "" then
        return __WrapEntity(val)
    elseif propDef.type == "component" and type(val) == "string" and val ~= "" then
        return __WrapComponent(val, propDef.componentType)
    elseif propDef.type == "prefab" and type(val) == "string" and val ~= "" then
        return __WrapPrefab(val)
    elseif propDef.type == "vec3" and val ~= nil then
        -- Vec3 properties arrive from JS as arrays [x, y, z] (userdata with
        -- numeric indices) or objects { x, y, z }. Hydrate into proper Vec3.
        if val[1] ~= nil then
            return math.vec3(val[1], val[2], val[3])
        elseif val.x ~= nil then
            return math.vec3(val.x, val.y, val.z)
        end
    end
    return val
end

function __WrapSelf(jsCtx, schema)
    local s = { __jsCtx = jsCtx }
    s.id = jsCtx.id
    s.slotId = jsCtx.slotId
    s.state = jsCtx.state

    -- Sync-on-Wrap Hydration:
    -- Instead of a proxy, we copy JS properties to a plain Lua table
    -- and wrap entities/prefabs/components using the schema.
    local props = {}
    if schema and schema.properties then
        for k, propDef in pairs(schema.properties) do
            local val = jsCtx.properties[k]
            props[k] = __WrapValue(val, propDef)
        end
    end
    s.properties = props

    setmetatable(s, __SelfMT)
    return s
end

-- Setup OOP Metatable logic for Entities and Components
__ComponentMT = {
    __index = function(t, k)
        return scene.getComponentProperty(t.entityId, t.type, k)
    end,
    __newindex = function(t, k, v)
        scene.setComponentProperty(t.entityId, t.type, k, v)
    end
}

function __WrapComponent(entityId, type)
    local c = { entityId = entityId, type = type }
    setmetatable(c, __ComponentMT)
    return c
end

-- Cross-script property proxy: entity.scripts.scriptName.propKey
__ScriptSlotMT = {
    __index = function(t, k)
        return scene.getScriptSlotProperty(t.entityId, t.scriptId, k)
    end,
    __newindex = function(t, k, v)
        scene.setScriptSlotProperty(t.entityId, t.scriptId, k, v)
    end
}

function __WrapScriptSlot(entityId, scriptId)
    local s = { entityId = entityId, scriptId = scriptId }
    setmetatable(s, __ScriptSlotMT)
    return s
end

__ScriptsProxyMT = {
    __index = function(t, scriptId)
        return __WrapScriptSlot(t.entityId, scriptId)
    end
}

function __WrapScriptsProxy(entityId)
    local p = { entityId = entityId }
    setmetatable(p, __ScriptsProxyMT)
    return p
end

-- Prefabs: prefab:instantiate(overrides)
__PrefabMT = {
    __index = {
        instantiate = function(t, overrides)
            return scene.instantiatePrefab(t.key, overrides)
        end
    }
}

function __WrapPrefab(key)
    local p = { key = key }
    setmetatable(p, __PrefabMT)
    return p
end

__EntityMT = {
    __index = function(t, k)
        -- 0. Cross-script access: entity.scripts
        if k == "scripts" then
            return __WrapScriptsProxy(t.id)
        end

        -- 1. Helper methods
        if k == "isValid" then
            return function(self) return scene.__exists(self.id) end
        end
        if k == "addComponent" then
            return function(self, type, params) return scene.addComponent(self.id, type, params) end
        end
        if k == "removeComponent" then
            return function(self, type) return scene.removeComponent(self.id, type) end
        end
        if k == "hasComponent" then
            return function(self, type) return scene.hasComponent(self.id, type) end
        end
        if k == "getComponent" then
            return function(self, type)
                if scene.hasComponent(self.id, type) then
                    return __WrapComponent(self.id, type)
                end
                return nil
            end
        end
        if k == "applyMaterial" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, "standardMaterial", overrides)
            end
        end
        if k == "applyGeometry" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, nil, overrides)
            end
        end
        if k == "applyResource" then
            return function(self, key, overrides) return scene.applyResource(self.id, key, nil, overrides) end
        end

        -- 2. Transform / Physics / Scene bridge helpers
        --    Return values are auto-wrapped: plain {x,y,z} → Vec3 with metatables.
        if transform and transform[k] then
            return function(self, ...) return __WrapVec3(transform[k](self, ...)) end
        end
        if physics and physics[k] then
            return function(self, ...) return __WrapVec3(physics[k](self, ...)) end
        end
        if scene and scene[k] then
            return function(self, ...) return scene[k](self, ...) end
        end




        -- 3. Dynamic Component Access (UCA)
        return __WrapComponent(t.id, k)
    end
}

function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = { id = id }
    setmetatable(e, __EntityMT)
    return e
end

-- ═══════════════════════════════════════════════════════════════════════
-- Lua-side Storage for Contexts & Hooks
-- ═══════════════════════════════════════════════════════════════════════
-- wasmoon serialises Lua tables to plain JS objects on Lua→JS boundary,
-- destroying all metatables. To preserve __SelfMT, __EntityMT, Vec3 etc.,
-- we keep contexts and compiled hook tables entirely in Lua and only pass
-- opaque string keys (slotId) across the boundary.

__Contexts  = {}
__SlotHooks = {}

--- Store compiled hooks for a slot (called from JS via doStringSync).
function __StoreSlot(slotId, hooks, ctx)
    __SlotHooks[slotId] = hooks
    __Contexts[slotId]  = ctx
end

--- Execute a named hook for a slot.  Returns true on success, false on error.
--- @param slotId string
--- @param hookName string
--- @return boolean
function __CallHook(slotId, hookName, ...)
    local hooks = __SlotHooks[slotId]
    local ctx   = __Contexts[slotId]
    if not hooks or not ctx then return true end
    local fn = hooks[hookName]
    if not fn then return true end
    fn(ctx, ...)
    return true
end

--- Remove all data for a slot.
function __RemoveSlot(slotId)
    __SlotHooks[slotId] = nil
    __Contexts[slotId]  = nil
end

--- Update a single property in an existing context (for syncProperties).
function __UpdateProperty(slotId, key, val, propDef)
    local ctx = __Contexts[slotId]
    if ctx and ctx.properties then
        ctx.properties[key] = __WrapValue(val, propDef)
    end
end